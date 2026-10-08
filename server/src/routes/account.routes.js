// =======================
// Perfil, favoritos, carrinho e pedidos da conta
// =======================
import { randomInt } from 'node:crypto';
import process from 'node:process';
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';

export const accountRouter = Router();
// O router compartilha o prefixo /api com as rotas publicas; apenas /me e recursos da conta exigem JWT.
const accountPaths = ['/me', '/favorites', '/cart', '/orders'];
for (const path of accountPaths) accountRouter.use(path, requireAuth);

async function findOrCreateProfile(user, client = pool) {
  const existing = await client.query(
    'SELECT id, nome_completo AS name, email, telefone AS phone FROM usuario WHERE auth_user_id = $1',
    [user.id],
  );
  if (existing.rowCount) return existing.rows[0];
  const name = String(user.user_metadata?.full_name || '').trim();
  const phone = String(user.user_metadata?.phone || '').trim();
  if (!name || !phone) return null;
  const inserted = await client.query(
    `INSERT INTO usuario (auth_user_id, nome_completo, email, telefone)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (auth_user_id) DO UPDATE SET email = EXCLUDED.email,
       nome_completo = EXCLUDED.nome_completo, telefone = EXCLUDED.telefone, atualizado_em = CURRENT_TIMESTAMP
     RETURNING id, nome_completo AS name, email, telefone AS phone`,
    [user.id, name.slice(0, 150), user.email, phone.slice(0, 20)],
  );
  return inserted.rows[0];
}

async function requireProfile(request, response, next) {
  try {
    request.profile = await findOrCreateProfile(request.authUser);
    if (!request.profile) return response.status(409).json({ error: 'Complete nome e telefone no cadastro para continuar.' });
    return next();
  } catch (error) {
    return next(error);
  }
}
for (const path of accountPaths) accountRouter.use(path, requireProfile);

// =======================
// Perfil e favoritos persistentes
// =======================
accountRouter.get('/me', (request, response) => response.json(request.profile));

accountRouter.get('/favorites', async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.slug, p.nome AS name, p.descricao AS description, p.imagem_url AS image,
        c.slug AS "categorySlug", pp.id AS "priceOptionId", pp.preco::numeric AS amount, pp.unidade_venda AS "saleUnit",
        pp.quantidade_venda AS "saleQuantity", w.valor::numeric AS "weightKg"
       FROM favorito f JOIN produto p ON p.id = f.produto_id
       JOIN categoria c ON c.id = p.categoria_id
       LEFT JOIN LATERAL (SELECT * FROM produto_preco x WHERE x.produto_id=p.id AND x.ativo ORDER BY x.peso_id NULLS LAST, x.preco LIMIT 1) pp ON TRUE
       LEFT JOIN peso w ON w.id = pp.peso_id
       WHERE f.usuario_id=$1 AND p.ativo ORDER BY f.criado_em DESC`, [request.profile.id],
    );
    return response.json(result.rows.map((row) => ({ ...row, price: Number(row.amount) })));
  } catch (error) { return next(error); }
});

accountRouter.post('/favorites/:productId', async (request, response, next) => {
  try {
    await pool.query(
      `INSERT INTO favorito (usuario_id, produto_id) SELECT $1, id FROM produto WHERE id=$2 AND ativo
       ON CONFLICT DO NOTHING`, [request.profile.id, request.params.productId],
    );
    return response.status(204).end();
  } catch (error) { return next(error); }
});

accountRouter.delete('/favorites/:productId', async (request, response, next) => {
  try {
    await pool.query('DELETE FROM favorito WHERE usuario_id=$1 AND produto_id=$2', [request.profile.id, request.params.productId]);
    return response.status(204).end();
  } catch (error) { return next(error); }
});

// =======================
// Carrinho autenticado e mesclagem do carrinho visitante
// =======================
async function getOrCreateCart(client, userId) {
  const result = await client.query(
    `INSERT INTO carrinho (usuario_id) VALUES ($1)
     ON CONFLICT (usuario_id) WHERE usuario_id IS NOT NULL AND ativo = TRUE
     DO UPDATE SET atualizado_em=CURRENT_TIMESTAMP RETURNING id`, [userId],
  );
  return result.rows[0].id;
}

async function addLine(client, cartId, item) {
  const productResult = await client.query(
    `SELECT p.id, p.nome, p.slug, p.imagem_url, pp.id AS price_id, pp.preco::numeric AS price,
       pp.peso_id, w.valor::numeric AS weight
     FROM produto p JOIN produto_preco pp ON pp.produto_id=p.id AND pp.ativo
     LEFT JOIN peso w ON w.id=pp.peso_id
     WHERE p.id=$1 AND p.ativo AND pp.id=$2`, [item.id, item.priceOptionId],
  );
  const product = productResult.rows[0];
  if (!product) throw Object.assign(new Error('Produto ou opcao de preco indisponivel.'), { status: 400 });
  const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));
  const configuration = item.configuration && typeof item.configuration === 'object' ? item.configuration : {};
  const notes = String(configuration.notes || '').slice(0, 500);
  let unitPrice = Number(product.price);
  if (product.slug === 'bolo-personalizado') {
    const fillingOptions = ['Brigadeiro','Ninho','Doce de leite','Prestígio','Beijinho','Chocolate','Morango'];
    const valid = ['Baunilha','Chocolate','Red velvet'].includes(configuration.mass)
      && Array.isArray(configuration.fillings) && configuration.fillings.length >= 1 && configuration.fillings.length <= 2
      && new Set(configuration.fillings).size === configuration.fillings.length
      && configuration.fillings.every((value) => fillingOptions.includes(value))
      && ['Ganache','Chantilly','Buttercream'].includes(configuration.coverage)
      && ['Acabamento clássico','Decoração especial'].includes(configuration.decoration)
      && Array.isArray(configuration.extras) && configuration.extras.length <= 3
      && new Set(configuration.extras).size === configuration.extras.length
      && configuration.extras.every((value) => ['Morangos frescos','Velas decorativas','Brigadeiros extras'].includes(value));
    const requestedWeight = Number(String(configuration.weight || '').replace(',', '.'));
    if (Number(product.weight) !== requestedWeight) {
      throw Object.assign(new Error('O peso selecionado nao corresponde a opcao de preco.'), { status: 400 });
    }
    if (!valid) throw Object.assign(new Error('A configuracao do bolo personalizado e invalida.'), { status: 400 });
    unitPrice += (configuration.fillings.length > 1 ? 10 : 0)
      + (configuration.decoration === 'Decoração especial' ? 15 : 0)
      + configuration.extras.length * 5;
  }
  const matching = await client.query(
    `SELECT id FROM item_carrinho WHERE carrinho_id=$1 AND produto_id=$2 AND produto_preco_id=$3
       AND configuracao=$4::jsonb AND COALESCE(observacoes,'')=$5 FOR UPDATE`,
    [cartId, product.id, product.price_id, JSON.stringify(configuration), notes],
  );
  if (matching.rowCount) {
    await client.query('UPDATE item_carrinho SET quantidade=quantidade+$2, subtotal=preco_unitario*(quantidade+$2) WHERE id=$1', [matching.rows[0].id, quantity]);
  } else {
    await client.query(
      `INSERT INTO item_carrinho (carrinho_id, produto_id, peso_id, produto_preco_id, quantidade, preco_unitario, subtotal, observacoes, configuracao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [cartId, product.id, product.peso_id, product.price_id, quantity, unitPrice, unitPrice * quantity, notes || null, JSON.stringify(configuration)],
    );
  }
}

async function loadCart(client, cartId) {
  const rows = await client.query(
    `SELECT i.id AS "lineId", p.id, p.nome AS name, p.imagem_url AS image, i.quantidade AS quantity,
       i.preco_unitario::numeric AS price, i.produto_preco_id AS "priceOptionId", i.configuracao AS configuration,
       i.peso_id AS "weightId", w.valor::numeric AS "weightKg"
     FROM item_carrinho i JOIN produto p ON p.id=i.produto_id
     LEFT JOIN peso w ON w.id=i.peso_id WHERE i.carrinho_id=$1 ORDER BY i.criado_em`, [cartId],
  );
  return rows.rows;
}

accountRouter.get('/cart', async (request, response, next) => {
  try {
    const client = await pool.connect();
    try { const id = await getOrCreateCart(client, request.profile.id); return response.json(await loadCart(client, id)); }
    finally { client.release(); }
  } catch (error) { return next(error); }
});

accountRouter.post('/cart/merge', async (request, response, next) => {
  const guestItems = Array.isArray(request.body?.items) ? request.body.items : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cartId = await getOrCreateCart(client, request.profile.id);
    for (const item of guestItems.slice(0, 100)) await addLine(client, cartId, item);
    const cart = await loadCart(client, cartId);
    await client.query('COMMIT');
    return response.json(cart);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally { client.release(); }
});

accountRouter.patch('/cart/items/:lineId', async (request, response, next) => {
  // Aplica o delta em uma unica operacao SQL, mantendo a quantidade sincronizada com o banco.
  if (request.body?.change !== undefined) {
    const change = Number(request.body.change);
    if (![-1, 1].includes(change)) return response.status(400).json({ error: 'A alteração deve ser +1 ou -1.' });
    try {
      // Trava a linha apenas durante esta instrução; menos em quantidade 1 remove o produto.
      const result = await pool.query(
        `WITH target AS MATERIALIZED (
           SELECT i.id, i.quantidade FROM item_carrinho i
           JOIN carrinho c ON c.id=i.carrinho_id
           WHERE c.usuario_id=$1 AND i.id=$2 FOR UPDATE OF i
         ), removed AS (
           DELETE FROM item_carrinho i USING target t
           WHERE i.id=t.id AND t.quantidade + $3 <= 0 RETURNING i.id
         ), changed AS (
           UPDATE item_carrinho i
           SET quantidade=LEAST(99, GREATEST(1, t.quantidade + $3)),
               subtotal=i.preco_unitario * LEAST(99, GREATEST(1, t.quantidade + $3))
           FROM target t
           WHERE i.id=t.id AND t.quantidade + $3 > 0 RETURNING i.id
         )
         SELECT id FROM removed UNION ALL SELECT id FROM changed`,
        [request.profile.id, request.params.lineId, change],
      );
      if (!result.rowCount) throw Object.assign(new Error('Esse item não está mais no carrinho.'), { status: 404 });
      return response.status(204).end();
    } catch (error) {
      return next(error);
    }
  }

  // Mantém compatibilidade com clientes antigos que enviam a quantidade total desejada.
  try {
    const quantity = Number(request.body?.quantity);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) return response.status(400).json({ error: 'Quantidade invalida.' });
    if (quantity === 0) await pool.query('DELETE FROM item_carrinho i USING carrinho c WHERE i.carrinho_id=c.id AND c.usuario_id=$1 AND i.id=$2', [request.profile.id, request.params.lineId]);
    else await pool.query('UPDATE item_carrinho i SET quantidade=$3, subtotal=i.preco_unitario*$3 FROM carrinho c WHERE i.carrinho_id=c.id AND c.usuario_id=$1 AND i.id=$2', [request.profile.id, request.params.lineId, quantity]);
    return response.status(204).end();
  } catch (error) { return next(error); }
});

accountRouter.delete('/cart/items/:lineId', async (request, response, next) => {
  try {
    await pool.query('DELETE FROM item_carrinho i USING carrinho c WHERE i.carrinho_id=c.id AND c.usuario_id=$1 AND i.id=$2', [request.profile.id, request.params.lineId]);
    return response.status(204).end();
  } catch (error) { return next(error); }
});

// =======================
// Criacao e historico de pedidos Pix
// =======================
accountRouter.get('/orders', async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT id, numero_pedido AS number, status, status_pagamento AS "paymentStatus",
        forma_recebimento AS "fulfillment", total::numeric AS total, criado_em AS "createdAt"
       FROM pedido WHERE usuario_id=$1 ORDER BY criado_em DESC LIMIT 50`, [request.profile.id],
    );
    const orderIds = result.rows.map((order) => order.id);
    const histories = orderIds.length
      ? await pool.query(
        `SELECT pedido_id AS "orderId", status, observacao AS observation, criado_em AS "createdAt"
         FROM pedido_status_historico WHERE pedido_id = ANY($1::uuid[]) ORDER BY criado_em ASC`, [orderIds],
      )
      : { rows: [] };
    const historyByOrder = new Map(orderIds.map((id) => [id, []]));
    for (const entry of histories.rows) historyByOrder.get(entry.orderId)?.push(entry);
    return response.json(result.rows.map((order) => ({
      ...order,
      statusHistory: historyByOrder.get(order.id) || [],
    })));
  } catch (error) { return next(error); }
});

// Estados permitidos em sequência; pedidos concluídos ou cancelados não podem ser reabertos.
const orderStatusTransitions = {
  PENDENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['EM_PRODUCAO', 'CANCELADO'],
  EM_PRODUCAO: ['PRONTO', 'CANCELADO'],
  PRONTO: ['ENTREGUE', 'CANCELADO'],
  ENTREGUE: [],
  CANCELADO: [],
};

const orderStatusNotes = {
  CONFIRMADO: 'Pedido confirmado pela loja.',
  EM_PRODUCAO: 'Pedido iniciado na produção.',
  PRONTO: 'Pedido pronto para retirada ou entrega.',
  ENTREGUE: 'Pedido entregue ou retirado pelo cliente.',
  CANCELADO: 'Pedido cancelado pela loja.',
};

function isOrderManager(request) {
  return env.orderManagerUserIds.has(String(request.authUser?.id || '').trim().toLowerCase());
}

// A gestão retorna apenas pedidos recentes e só para UUIDs autorizados no ambiente do servidor.
accountRouter.get('/orders/manage', async (request, response, next) => {
  if (!isOrderManager(request)) return response.status(403).json({ error: 'Acesso restrito à equipe da loja.' });
  try {
    const result = await pool.query(
      `SELECT o.id, o.numero_pedido AS number, o.status, o.status_pagamento AS "paymentStatus",
        o.forma_recebimento AS "fulfillment", o.total::numeric AS total, o.criado_em AS "createdAt",
        u.nome_completo AS "customerName", u.email AS "customerEmail", u.telefone AS "customerPhone"
       FROM pedido o JOIN usuario u ON u.id=o.usuario_id
       ORDER BY o.criado_em DESC LIMIT 100`,
    );
    return response.json(result.rows);
  } catch (error) { return next(error); }
});

// Apenas a equipe autorizada pode avançar o status ou confirmar manualmente um Pix recebido.
accountRouter.patch('/orders/manage/:orderId', async (request, response, next) => {
  if (!isOrderManager(request)) return response.status(403).json({ error: 'Acesso restrito à equipe da loja.' });
  const { orderId } = request.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    return response.status(400).json({ error: 'Identificador de pedido inválido.' });
  }
  const requestedStatus = request.body?.status;
  const confirmPayment = request.body?.paymentStatus === 'PAGO';
  if (requestedStatus === undefined && !confirmPayment) {
    return response.status(400).json({ error: 'Informe uma atualização válida para o pedido.' });
  }
  if (requestedStatus !== undefined && !Object.hasOwn(orderStatusTransitions, requestedStatus)) {
    return response.status(400).json({ error: 'Status de pedido inválido.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentResult = await client.query(
      'SELECT id, status, status_pagamento AS "paymentStatus" FROM pedido WHERE id=$1 FOR UPDATE', [orderId],
    );
    const current = currentResult.rows[0];
    if (!current) throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 });

    const nextStatus = requestedStatus ?? current.status;
    let nextPaymentStatus = current.paymentStatus;
    if (requestedStatus && requestedStatus !== current.status
      && !orderStatusTransitions[current.status].includes(requestedStatus)) {
      throw Object.assign(new Error('Essa mudança de status não é permitida.'), { status: 409 });
    }
    if (confirmPayment && (current.paymentStatus !== 'PENDENTE' || current.status === 'CANCELADO')) {
      throw Object.assign(new Error('Só é possível confirmar o Pix de um pedido ativo e ainda pendente.'), { status: 409 });
    }
    if (confirmPayment) nextPaymentStatus = 'PAGO';
    if (nextStatus === 'CANCELADO' && nextPaymentStatus === 'PENDENTE') nextPaymentStatus = 'CANCELADO';

    const updated = await client.query(
      `UPDATE pedido SET status=$2, status_pagamento=$3, atualizado_em=CURRENT_TIMESTAMP
       WHERE id=$1
       RETURNING id, numero_pedido AS number, status, status_pagamento AS "paymentStatus",
         forma_recebimento AS "fulfillment", total::numeric AS total, criado_em AS "createdAt"`,
      [orderId, nextStatus, nextPaymentStatus],
    );
    if (nextStatus !== current.status) {
      const note = String(request.body?.observation || orderStatusNotes[nextStatus]).trim().slice(0, 250);
      await client.query(
        'INSERT INTO pedido_status_historico (pedido_id,status,observacao) VALUES ($1,$2,$3)',
        [orderId, nextStatus, note],
      );
    }
    if (confirmPayment) {
      await client.query(
        'INSERT INTO pedido_status_historico (pedido_id,status,observacao) VALUES ($1,$2,$3)',
        [orderId, nextStatus, 'Pagamento Pix confirmado pela loja.'],
      );
    }
    if (nextStatus === 'CANCELADO' && current.paymentStatus === 'PENDENTE') {
      await client.query(
        'INSERT INTO pedido_status_historico (pedido_id,status,observacao) VALUES ($1,$2,$3)',
        [orderId, nextStatus, 'Pagamento Pix pendente cancelado junto com o pedido.'],
      );
    }
    await client.query('COMMIT');
    return response.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally { client.release(); }
});

accountRouter.post('/orders', async (request, response, next) => {
  const fulfillment = request.body?.fulfillment;
  if (!['RETIRADA', 'ENTREGA'].includes(fulfillment)) return response.status(400).json({ error: 'Escolha retirada ou entrega.' });
  const address = request.body?.address || {};
  if (fulfillment === 'ENTREGA' && ['cep','logradouro','numero','bairro','cidade','estado'].some((key) => !String(address[key] || '').trim())) {
    return response.status(400).json({ error: 'Preencha o endereco de entrega.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cartId = await getOrCreateCart(client, request.profile.id);
    const lines = await loadCart(client, cartId);
    if (!lines.length) throw Object.assign(new Error('O carrinho esta vazio.'), { status: 400 });
    const subtotal = lines.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0);
    const deliveryFee = fulfillment === 'ENTREGA' ? Number(process.env.DELIVERY_FEE || 0) : 0;
    const orderNumber = `CB${Date.now().toString().slice(-8)}${randomInt(10, 99)}`;
    const order = await client.query(
      `INSERT INTO pedido (numero_pedido, usuario_id, forma_recebimento, metodo_pagamento, subtotal, taxa_entrega, total, observacoes)
       VALUES ($1,$2,$3,'PIX',$4,$5,$6,$7) RETURNING id, numero_pedido AS number, status, status_pagamento AS "paymentStatus", total::numeric AS total, criado_em AS "createdAt"`,
      [orderNumber, request.profile.id, fulfillment, subtotal, deliveryFee, subtotal + deliveryFee, String(request.body?.notes || '').slice(0, 500) || null],
    );
    for (const line of lines) {
      await client.query(
        `INSERT INTO item_pedido (pedido_id, produto_id, peso_id, nome_produto, preco_unitario, quantidade, subtotal, observacoes, configuracao)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
        [order.rows[0].id, line.id, line.weightId, line.name, line.price, line.quantity, Number(line.price) * line.quantity, line.configuration?.notes || null, JSON.stringify(line.configuration || {})],
      );
    }
    if (fulfillment === 'ENTREGA') {
      await client.query(
        `INSERT INTO pedido_endereco (pedido_id, cep, logradouro, numero, complemento, bairro, cidade, estado, ponto_referencia)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [order.rows[0].id, address.cep, address.logradouro, address.numero, address.complemento || null, address.bairro, address.cidade, String(address.estado).slice(0,2).toUpperCase(), address.pontoReferencia || null],
      );
    }
    const initialHistory = await client.query(
      `INSERT INTO pedido_status_historico (pedido_id,status,observacao)
       VALUES ($1,'PENDENTE','Pedido recebido; pagamento Pix pendente.')
       RETURNING status, observacao AS observation, criado_em AS "createdAt"`, [order.rows[0].id],
    );
    await client.query('DELETE FROM item_carrinho WHERE carrinho_id=$1', [cartId]);
    await client.query('COMMIT');
    return response.status(201).json({ ...order.rows[0], statusHistory: initialHistory.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally { client.release(); }
});
