-- =======================
-- Perfil ligado ao Supabase Auth
-- =======================
ALTER TABLE usuario
  ALTER COLUMN senha_hash DROP NOT NULL,
  ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- =======================
-- Snapshot de configuracoes dos itens
-- =======================
ALTER TABLE item_carrinho
  ADD COLUMN produto_preco_id UUID REFERENCES produto_preco(id) ON DELETE RESTRICT,
  ADD COLUMN configuracao JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE item_pedido
  ADD COLUMN configuracao JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX ix_usuario_auth_user ON usuario(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- =======================
-- Produto e precos do bolo personalizado
-- =======================
INSERT INTO produto (categoria_id, nome, slug, descricao, eh_personalizavel, ordem_vitrine)
SELECT id, 'Bolo personalizado', 'bolo-personalizado',
       'Bolo montado pelo questionario de personalizacao.', TRUE, 99
FROM categoria WHERE slug = 'bolos'
ON CONFLICT (slug) DO UPDATE SET ativo = TRUE, atualizado_em = CURRENT_TIMESTAMP;

INSERT INTO peso (valor, unidade)
SELECT seed.valor, 'kg'
FROM (VALUES (1.00), (1.50), (2.00), (2.50), (3.00), (4.00), (5.00)) AS seed(valor)
WHERE NOT EXISTS (
  SELECT 1 FROM peso WHERE peso.valor = seed.valor AND peso.unidade = 'kg'
);

INSERT INTO produto_preco (produto_id, peso_id, preco)
SELECT product.id, weight.id, seed.preco
FROM (VALUES
  (1.00, 55.00), (1.50, 68.00), (2.00, 80.00), (2.50, 98.00),
  (3.00, 115.00), (4.00, 145.00), (5.00, 175.00)
) AS seed(peso, preco)
JOIN produto AS product ON product.slug = 'bolo-personalizado'
JOIN peso AS weight ON weight.valor = seed.peso AND weight.unidade = 'kg'
ON CONFLICT (produto_id, peso_id) WHERE peso_id IS NOT NULL
DO UPDATE SET preco = EXCLUDED.preco, ativo = TRUE, atualizado_em = CURRENT_TIMESTAMP;
