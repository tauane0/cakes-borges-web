-- =======================
-- Rollback manual da migration inicial; este arquivo e destrutivo
-- =======================

-- Down Migration
DROP TABLE IF EXISTS item_pedido_opcao, item_pedido, pedido_endereco, pedido_status_historico, pedido,
  endereco, item_carrinho_opcao, item_carrinho, carrinho, favorito, produto_opcao,
  opcao_personalizacao, tipo_opcao, produto_preco, peso, produto, categoria, usuario;
