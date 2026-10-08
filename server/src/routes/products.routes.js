// =======================
// Consulta pública do catálogo
// =======================
import { Router } from 'express';
import { pool } from '../db/pool.js';

export const productsRouter = Router();

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Formata as unidades em que complementos são vendidos para os cards da loja.
function formatSaleUnit(priceOption) {
  if (priceOption.saleUnit === 'caixa') return ` / ${priceOption.saleQuantity} un.`;
  if (priceOption.saleUnit === 'unidade') return ' / un.';
  return '';
}

productsRouter.get('/products', async (request, response, next) => {
  const category = request.query.category;
  const featuredQuery = request.query.featured;

  if (category !== undefined && (typeof category !== 'string' || !category.trim())) {
    return response.status(400).json({ error: 'A categoria informada é inválida.' });
  }

  if (featuredQuery !== undefined && featuredQuery !== 'true' && featuredQuery !== 'false') {
    return response.status(400).json({ error: 'O filtro featured deve ser true ou false.' });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          product.id,
          product.slug,
          product.nome AS name,
          product.descricao AS description,
          product.imagem_url AS image,
          product.destaque AS featured,
          product.ordem_vitrine AS display_order,
          product.avaliacao AS rating,
          product.total_avaliacoes AS reviews,
          category.nome AS category,
          category.slug AS category_slug,
          COALESCE(
            json_agg(
              json_build_object(
                'id', product_price.id,
                'amount', product_price.preco::text,
                'weightKg', weight.valor::text,
                'saleUnit', product_price.unidade_venda,
                'saleQuantity', product_price.quantidade_venda
              )
              ORDER BY weight.valor NULLS LAST, product_price.unidade_venda, product_price.quantidade_venda
            ) FILTER (WHERE product_price.id IS NOT NULL),
            '[]'::json
          ) AS price_options
        FROM produto AS product
        JOIN categoria AS category ON category.id = product.categoria_id
        LEFT JOIN produto_preco AS product_price ON product_price.produto_id = product.id AND product_price.ativo = TRUE
        LEFT JOIN peso AS weight ON weight.id = product_price.peso_id
        WHERE product.ativo = TRUE
          AND product.slug <> 'bolo-personalizado'
          AND category.ativo = TRUE
          AND ($1::text IS NULL OR category.slug = $1)
          AND ($2::boolean IS NULL OR product.destaque = $2)
        GROUP BY product.id, category.id
        ORDER BY category.slug, product.ordem_vitrine, product.nome
      `,
      [category?.trim() || null, featuredQuery === undefined ? null : featuredQuery === 'true'],
    );

    const products = result.rows.map((product) => {
      const priceOptions = product.price_options.map((option) => ({
        id: option.id,
        amount: Number(option.amount),
        weightKg: option.weightKg === null ? null : Number(option.weightKg),
        saleUnit: option.saleUnit,
        saleQuantity: option.saleQuantity,
      }));
      const startingPrice = priceOptions[0];

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        image: product.image,
        featured: product.featured,
        rating: Number(product.rating).toFixed(1),
        reviews: product.reviews,
        category: product.category,
        categorySlug: product.category_slug,
        priceOptions,
        priceOptionId: startingPrice?.id ?? null,
        price: startingPrice
          ? `${currency.format(startingPrice.amount)}${formatSaleUnit(startingPrice)}`
          : 'Consulte o preço',
      };
    });

    return response.json(products);
  } catch (error) {
    return next(error);
  }
});

// =======================
// Opcao de preco oficial para o questionario do bolo personalizado
// =======================
productsRouter.get('/custom-cake', async (_request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT p.id AS "productId", p.nome AS name, p.imagem_url AS image, pp.id AS "priceOptionId",
        pp.preco::numeric AS amount, w.valor::numeric AS "weightKg"
       FROM produto p JOIN produto_preco pp ON pp.produto_id=p.id AND pp.ativo
       JOIN peso w ON w.id=pp.peso_id WHERE p.slug='bolo-personalizado' AND p.ativo
       ORDER BY w.valor`,
    );
    return response.json(result.rows.map((row) => ({ ...row, amount: Number(row.amount), weightKg: Number(row.weightKg) })));
  } catch (error) { return next(error); }
});
