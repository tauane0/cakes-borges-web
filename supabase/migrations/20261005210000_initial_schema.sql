-- Up Migration

-- =======================
-- UUIDs, contas e catalogo
-- =======================
CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome_completo VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE, senha_hash VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL, ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE categoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE, descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE, criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE produto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), categoria_id UUID NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
  nome VARCHAR(120) NOT NULL, slug VARCHAR(140) NOT NULL UNIQUE, descricao TEXT, imagem_url VARCHAR(255),
  eh_personalizavel BOOLEAN NOT NULL DEFAULT FALSE, ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE peso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), valor NUMERIC(4,2) NOT NULL CHECK (valor > 0),
  unidade VARCHAR(2) NOT NULL DEFAULT 'kg', rendimento_min SMALLINT CHECK (rendimento_min IS NULL OR rendimento_min > 0),
  rendimento_max SMALLINT CHECK (rendimento_max IS NULL OR rendimento_max > 0), ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (rendimento_min IS NULL OR rendimento_max IS NULL OR rendimento_max >= rendimento_min)
);
CREATE TABLE produto_preco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), produto_id UUID NOT NULL REFERENCES produto(id) ON DELETE RESTRICT,
  peso_id UUID NOT NULL REFERENCES peso(id) ON DELETE RESTRICT, preco NUMERIC(10,2) NOT NULL CHECK (preco > 0),
  ativo BOOLEAN NOT NULL DEFAULT TRUE, criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (produto_id, peso_id)
);

-- =======================
-- Opções de personalização
-- =======================
CREATE TABLE tipo_opcao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome VARCHAR(30) NOT NULL UNIQUE,
  quantidade_minima SMALLINT NOT NULL DEFAULT 0 CHECK (quantidade_minima >= 0),
  quantidade_maxima SMALLINT NOT NULL CHECK (quantidade_maxima >= quantidade_minima),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE opcao_personalizacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tipo_id UUID NOT NULL REFERENCES tipo_opcao(id) ON DELETE RESTRICT,
  nome VARCHAR(100) NOT NULL, descricao TEXT, imagem_url VARCHAR(255), ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE produto_opcao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), produto_id UUID NOT NULL REFERENCES produto(id) ON DELETE RESTRICT,
  opcao_id UUID NOT NULL REFERENCES opcao_personalizacao(id) ON DELETE RESTRICT,
  preco_adicional NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (preco_adicional >= 0), ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (produto_id, opcao_id)
);

-- =======================
-- Favoritos por conta
-- =======================
CREATE TABLE favorito (
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produto(id) ON DELETE RESTRICT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (usuario_id, produto_id)
);

-- =======================
-- Carrinhos e opções selecionadas
-- =======================
CREATE TABLE carrinho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE,
  sessao_id VARCHAR(100), criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, ativo BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (usuario_id IS NOT NULL OR sessao_id IS NOT NULL)
);
CREATE UNIQUE INDEX uq_carrinho_usuario_ativo ON carrinho(usuario_id) WHERE usuario_id IS NOT NULL AND ativo = TRUE;
CREATE UNIQUE INDEX uq_carrinho_sessao_ativa ON carrinho(sessao_id) WHERE sessao_id IS NOT NULL AND ativo = TRUE;
CREATE TABLE item_carrinho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), carrinho_id UUID NOT NULL REFERENCES carrinho(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produto(id) ON DELETE RESTRICT,
  -- Peso é opcional para complementos vendidos por unidade.
  peso_id UUID REFERENCES peso(id) ON DELETE RESTRICT, quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0), subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  observacoes TEXT, criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE item_carrinho_opcao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), item_carrinho_id UUID NOT NULL REFERENCES item_carrinho(id) ON DELETE CASCADE,
  opcao_id UUID NOT NULL REFERENCES opcao_personalizacao(id) ON DELETE RESTRICT,
  preco_adicional NUMERIC(10,2) NOT NULL CHECK (preco_adicional >= 0), quantidade SMALLINT NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  ordem_selecao SMALLINT CHECK (ordem_selecao IS NULL OR ordem_selecao > 0)
);
-- A mesclagem futura compara produto, peso, opções (com ordem) e observações; configurações distintas permanecem separadas.

-- =======================
-- Endereços e pedidos
-- =======================
CREATE TABLE endereco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  cep VARCHAR(9) NOT NULL, logradouro VARCHAR(150) NOT NULL, numero VARCHAR(20) NOT NULL, complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL, cidade VARCHAR(100) NOT NULL, estado CHAR(2) NOT NULL,
  ponto_referencia VARCHAR(150), apelido VARCHAR(50), ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), numero_pedido VARCHAR(20) NOT NULL UNIQUE,
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','CONFIRMADO','EM_PRODUCAO','PRONTO','ENTREGUE','CANCELADO')),
  forma_recebimento VARCHAR(15) NOT NULL CHECK (forma_recebimento IN ('RETIRADA','ENTREGA')),
  metodo_pagamento VARCHAR(10) NOT NULL DEFAULT 'PIX' CHECK (metodo_pagamento = 'PIX'),
  status_pagamento VARCHAR(15) NOT NULL DEFAULT 'PENDENTE' CHECK (status_pagamento IN ('PENDENTE','PAGO','CANCELADO')),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0), taxa_entrega NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (taxa_entrega >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total = subtotal + taxa_entrega), observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE item_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE RESTRICT,
  produto_id UUID REFERENCES produto(id) ON DELETE RESTRICT, peso_id UUID REFERENCES peso(id) ON DELETE RESTRICT,
  nome_produto VARCHAR(120) NOT NULL, preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0), subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  observacoes TEXT, criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE item_pedido_opcao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), item_pedido_id UUID NOT NULL REFERENCES item_pedido(id) ON DELETE RESTRICT,
  opcao_id UUID REFERENCES opcao_personalizacao(id) ON DELETE RESTRICT, tipo_nome VARCHAR(30) NOT NULL, nome_opcao VARCHAR(100) NOT NULL,
  preco_adicional NUMERIC(10,2) NOT NULL CHECK (preco_adicional >= 0), quantidade SMALLINT NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  ordem_selecao SMALLINT CHECK (ordem_selecao IS NULL OR ordem_selecao > 0)
);
CREATE TABLE pedido_endereco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), pedido_id UUID NOT NULL UNIQUE REFERENCES pedido(id) ON DELETE RESTRICT,
  cep VARCHAR(9) NOT NULL, logradouro VARCHAR(150) NOT NULL, numero VARCHAR(20) NOT NULL, complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL, cidade VARCHAR(100) NOT NULL, estado CHAR(2) NOT NULL, ponto_referencia VARCHAR(150)
);
CREATE TABLE pedido_status_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE','CONFIRMADO','EM_PRODUCAO','PRONTO','ENTREGUE','CANCELADO')),
  observacao TEXT, criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- Índices para telas de catálogo, conta e pedidos
-- =======================
CREATE INDEX ix_produto_categoria_ativo ON produto(categoria_id, ativo);
CREATE INDEX ix_produto_preco_produto ON produto_preco(produto_id, ativo);
CREATE INDEX ix_favorito_produto ON favorito(produto_id);
CREATE INDEX ix_item_carrinho_carrinho ON item_carrinho(carrinho_id);
CREATE INDEX ix_endereco_usuario_ativo ON endereco(usuario_id, ativo);
CREATE INDEX ix_pedido_usuario_data ON pedido(usuario_id, criado_em DESC);
CREATE INDEX ix_item_pedido_pedido ON item_pedido(pedido_id);
CREATE INDEX ix_historico_pedido_data ON pedido_status_historico(pedido_id, criado_em);
