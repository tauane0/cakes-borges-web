-- =======================
-- Preços genéricos e dados demonstrativos do catálogo
-- =======================

-- O preço pode variar por peso (bolos) ou por unidade/embalagem (complementos e kits).
ALTER TABLE produto_preco
  DROP CONSTRAINT IF EXISTS produto_preco_produto_id_peso_id_key,
  ALTER COLUMN peso_id DROP NOT NULL,
  ADD COLUMN unidade_venda VARCHAR(30),
  ADD COLUMN quantidade_venda SMALLINT,
  ADD CONSTRAINT ck_produto_preco_forma_venda CHECK (
    (peso_id IS NOT NULL AND unidade_venda IS NULL AND quantidade_venda IS NULL)
    OR
    (peso_id IS NULL AND unidade_venda IS NOT NULL AND btrim(unidade_venda) <> ''
      AND quantidade_venda IS NOT NULL AND quantidade_venda > 0)
  );

CREATE UNIQUE INDEX uq_produto_preco_peso
  ON produto_preco (produto_id, peso_id)
  WHERE peso_id IS NOT NULL;

CREATE UNIQUE INDEX uq_produto_preco_unidade
  ON produto_preco (produto_id, unidade_venda, quantidade_venda)
  WHERE peso_id IS NULL;

-- Campos mantêm a ordem da vitrine e os números demonstrativos já exibidos nos cards.
ALTER TABLE produto
  ADD COLUMN destaque BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN ordem_vitrine SMALLINT NOT NULL DEFAULT 0 CHECK (ordem_vitrine >= 0),
  ADD COLUMN avaliacao NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (avaliacao BETWEEN 0 AND 5),
  ADD COLUMN total_avaliacoes INTEGER NOT NULL DEFAULT 0 CHECK (total_avaliacoes >= 0);

-- =======================
-- Categorias e produtos de demonstração
-- =======================
INSERT INTO categoria (nome, slug, descricao) VALUES
  ('Bolos', 'bolos', 'Bolos prontos da vitrine Cakes Borges.'),
  ('Complementos', 'complementos', 'Doces e acompanhamentos para comemorações.'),
  ('Kits', 'kits', 'Combinações prontas para compartilhar.')
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  ativo = TRUE,
  atualizado_em = CURRENT_TIMESTAMP;

INSERT INTO peso (valor, unidade)
SELECT 1.00, 'kg'
WHERE NOT EXISTS (
  SELECT 1 FROM peso WHERE valor = 1.00 AND unidade = 'kg'
);

INSERT INTO produto (
  categoria_id, nome, slug, descricao, imagem_url, destaque, ordem_vitrine, avaliacao, total_avaliacoes
)
SELECT categoria.id, seed.nome, seed.slug, seed.descricao, seed.imagem_url,
       seed.destaque, seed.ordem_vitrine, seed.avaliacao, seed.total_avaliacoes
FROM (VALUES
  ('bolos', 'Bolo de Morango', 'bolo-morango', 'Massa leve com recheio cremoso de morango.', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=85', TRUE, 1, 4.9, 124),
  ('bolos', 'Bolo de Chocolate', 'bolo-chocolate', 'Chocolate intenso com cobertura bem cremosa.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=85', TRUE, 2, 4.8, 98),
  ('bolos', 'Red Velvet', 'red-velvet', 'Massa aveludada com recheio suave de baunilha.', 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=85', TRUE, 3, 5.0, 86),
  ('bolos', 'Bolo de Baunilha', 'bolo-baunilha', 'Massa delicada com creme de baunilha.', 'https://images.unsplash.com/photo-1558303053-6d6c9c8d5f9c?auto=format&fit=crop&w=800&q=85', TRUE, 4, 4.8, 73),
  ('bolos', 'Bolo de Frutas', 'bolo-frutas', 'Frutas frescas, creme leve e massa macia.', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=85', TRUE, 5, 4.9, 65),
  ('bolos', 'Bolo de Brigadeiro', 'bolo-brigadeiro', 'Massa de chocolate com brigadeiro cremoso.', 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=85', TRUE, 6, 4.9, 81),
  ('complementos', 'Brigadeiros tradicionais', 'brigadeiros', 'Brigadeiros enrolados com granulado de chocolate.', 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=800&q=85', FALSE, 1, 4.9, 52),
  ('complementos', 'Beijinhos de coco', 'beijinhos', 'Docinhos macios de coco finalizados com coco ralado.', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=85', FALSE, 2, 4.8, 43),
  ('complementos', 'Brownie artesanal', 'brownie', 'Brownie de chocolate com casquinha crocante e centro macio.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=85', FALSE, 3, 4.9, 36),
  ('complementos', 'Caixa de docinhos sortidos', 'docinhos-sortidos', 'Seleção de brigadeiros, beijinhos e sabores especiais.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=85', FALSE, 4, 5.0, 29),
  ('complementos', 'Pão de mel', 'pao-de-mel', 'Massa aromática com doce de leite e cobertura de chocolate.', 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=800&q=85', FALSE, 5, 4.8, 22),
  ('complementos', 'Cookies de chocolate', 'cookies', 'Cookies macios com gotas de chocolate ao leite.', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=85', FALSE, 6, 4.9, 34),
  ('kits', 'Kit Festa Pequena', 'kit-festa-pequena', 'Bolo de chocolate de 1 kg com 20 docinhos sortidos.', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=85', FALSE, 1, 4.9, 38),
  ('kits', 'Kit Celebração', 'kit-celebracao', 'Bolo de morango de 2 kg com 30 docinhos para compartilhar.', 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=800&q=85', FALSE, 2, 5.0, 24),
  ('kits', 'Kit Café da Tarde', 'kit-cafe-tarde', 'Bolo caseiro de baunilha acompanhado de brownies.', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=85', FALSE, 3, 4.8, 31)
) AS seed(categoria_slug, nome, slug, descricao, imagem_url, destaque, ordem_vitrine, avaliacao, total_avaliacoes)
JOIN categoria ON categoria.slug = seed.categoria_slug
ON CONFLICT (slug) DO UPDATE SET
  categoria_id = EXCLUDED.categoria_id,
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  imagem_url = EXCLUDED.imagem_url,
  destaque = EXCLUDED.destaque,
  ordem_vitrine = EXCLUDED.ordem_vitrine,
  avaliacao = EXCLUDED.avaliacao,
  total_avaliacoes = EXCLUDED.total_avaliacoes,
  ativo = TRUE,
  atualizado_em = CURRENT_TIMESTAMP;

-- Os preços atuais são demonstrativos; os bolos usam a opção base de 1 kg.
INSERT INTO produto_preco (produto_id, peso_id, preco)
SELECT produto.id, peso.id, seed.preco
FROM (VALUES
  ('bolo-morango', 89.90),
  ('bolo-chocolate', 94.90),
  ('red-velvet', 109.90),
  ('bolo-baunilha', 79.90),
  ('bolo-frutas', 99.90),
  ('bolo-brigadeiro', 99.90)
) AS seed(slug, preco)
JOIN produto ON produto.slug = seed.slug
JOIN peso ON peso.valor = 1.00 AND peso.unidade = 'kg'
ON CONFLICT (produto_id, peso_id) WHERE peso_id IS NOT NULL
DO UPDATE SET preco = EXCLUDED.preco, ativo = TRUE, atualizado_em = CURRENT_TIMESTAMP;

INSERT INTO produto_preco (produto_id, peso_id, preco, unidade_venda, quantidade_venda)
SELECT produto.id, NULL, seed.preco, seed.unidade_venda, seed.quantidade_venda
FROM (VALUES
  ('brigadeiros', 44.90, 'caixa', 25),
  ('beijinhos', 42.90, 'caixa', 25),
  ('brownie', 9.90, 'unidade', 1),
  ('docinhos-sortidos', 49.90, 'caixa', 25),
  ('pao-de-mel', 8.50, 'unidade', 1),
  ('cookies', 7.90, 'unidade', 1),
  ('kit-festa-pequena', 149.90, 'kit', 1),
  ('kit-celebracao', 239.90, 'kit', 1),
  ('kit-cafe-tarde', 89.90, 'kit', 1)
) AS seed(slug, preco, unidade_venda, quantidade_venda)
JOIN produto ON produto.slug = seed.slug
ON CONFLICT (produto_id, unidade_venda, quantidade_venda) WHERE peso_id IS NULL
DO UPDATE SET preco = EXCLUDED.preco, ativo = TRUE, atualizado_em = CURRENT_TIMESTAMP;

-- =======================
-- Proteção das tabelas no esquema público
-- =======================
-- O catálogo é lido pela API do servidor; acesso direto pelo Data API fica bloqueado sem políticas.
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE peso ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_opcao ENABLE ROW LEVEL SECURITY;
ALTER TABLE opcao_personalizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_opcao ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorito ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrinho ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_carrinho ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_carrinho_opcao ENABLE ROW LEVEL SECURITY;
ALTER TABLE endereco ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_pedido_opcao ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_endereco ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_status_historico ENABLE ROW LEVEL SECURITY;
