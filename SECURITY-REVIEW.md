# Revisao de seguranca

Data: 2026-10-07

Escopo: revisao estatica do codigo e dos arquivos rastreados no commit inicial
publicado em `main`, com correcoes locais subsequentes. Nenhuma alteracao foi
feita no projeto Supabase remoto.

## Resumo

Nao foram encontrados segredos reais ou dados de producao rastreados no commit
revisado. Os arquivos de ambiente versionados sao exemplos com valores
placeholder, e os arquivos `.env` sao ignorados pelo Git.

Foram identificados dois riscos de severidade media no codigo. As correcoes
locais agora exigem verificacao TLS com CA configurada e autorizam a equipe por
UUID. A revisao do repositorio, sozinha, nao confirma a configuracao efetiva
nem a implantacao no ambiente de producao.

## Achados

### MEDIO — Conexao PostgreSQL sem verificacao do certificado indicada no exemplo (corrigido no codigo)

- Arquivos originalmente envolvidos: `server/.env.example` e
  `server/src/db/pool.js`.
- O pool agora configura `rejectUnauthorized: true` com a CA apontada por
  `DATABASE_SSL_CA_PATH`, e o processo falha se a CA estiver ausente ou nao for
  um certificado PEM.
  Parametros TLS na URL tambem sao rejeitados para impedir que substituam as
  opcoes explicitas do driver.
- Para conectar, cada ambiente ainda precisa receber a CA raiz correta do
  projeto Supabase. A configuracao efetiva de producao nao foi verificada.
- Confianca inicial: 9/10. A configuracao real de producao nao foi verificada.

### MEDIO — Autorizacao da equipe baseada apenas no endereco de e-mail (corrigido no codigo)

- Arquivos originalmente envolvidos: `server/src/middleware/auth.js` e
  `server/src/routes/account.routes.js`.
- As rotas de gestao agora comparam o UUID autenticado com
  `ORDER_MANAGER_USER_IDS`, uma lista server-side de IDs validada na inicializacao.
- A lista ainda precisa ser preenchida com os UUIDs corretos em cada ambiente.
  Essa revisao nao verificou a configuracao de producao nem o provisionamento
  das contas de equipe.
- Confianca inicial: 8/10. A possibilidade de exploracao depende das configuracoes
  reais de Auth e das contas existentes, que nao foram verificadas.

## Observacoes sobre o banco

As migrations revisadas habilitam RLS nas tabelas da aplicacao e nao definem
policies permissivas; tambem nao foram encontradas views ou funcoes SQL nessas
migrations. Isso reduz o acesso direto por RLS para roles sujeitos a ela, mas
nao comprova as configuracoes do projeto remoto, os grants, as configuracoes da
Data API, nem se as migrations foram aplicadas.

Esta revisao nao consultou o painel, os logs ou o banco de dados remoto e nao
executou testes de intrusao. Portanto, ela nao certifica a seguranca completa do
banco em producao.
