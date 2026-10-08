# Revisao de seguranca

Data: 2026-10-07

Escopo: revisao estatica do codigo e dos arquivos rastreados no commit inicial
publicado em `main`. Nenhuma alteracao foi feita no codigo da aplicacao ou no
projeto Supabase remoto.

## Resumo

Nao foram encontrados segredos reais ou dados de producao rastreados no commit
revisado. Os arquivos de ambiente versionados sao exemplos com valores
placeholder, e os arquivos `.env` sao ignorados pelo Git.

Foram identificados dois riscos de severidade media no codigo. A revisao do
repositorio, sozinha, nao confirma as configuracoes efetivas de Auth, TLS,
grants, Data API ou a aplicacao das migrations no projeto Supabase remoto.

## Achados

### MEDIO — Conexao PostgreSQL sem verificacao do certificado indicada no exemplo

- Arquivos: `server/.env.example` (linhas 7-8) e `server/src/db/pool.js`
  (linhas 7-12).
- O exemplo orienta usar `sslmode=require`, enquanto o comentario diz para
  configurar a CA em producao, mas nao mostra uma configuracao de verificacao
  do certificado. O pool passa a URL de conexao diretamente para o driver.
- Se a conexao efetiva em producao usar essa configuracao sem validar o
  certificado, a criptografia da conexao nao garante que o servidor remoto e o
  Supabase esperado; um intermediario de rede poderia se passar pelo servidor.
- Recomendacao: validar o certificado TLS usando a CA confiavel do Supabase e
  confirmar que a configuracao efetiva de producao nao desativa essa validacao.
- Confianca: 9/10. A configuracao real de producao nao foi verificada.

### MEDIO — Autorizacao da equipe baseada apenas no endereco de e-mail

- Arquivos: `server/src/middleware/auth.js` (linhas 18-20) e
  `server/src/routes/account.routes.js` (linhas 275-296).
- O middleware exige um usuario autenticado com `id` e `email`. A autorizacao
  das rotas de gestao compara o e-mail da sessao com a lista
  `ORDER_MANAGER_EMAILS`; nao verifica um papel de equipe ou um identificador
  imutavel autorizado.
- Se um endereco listado nao estiver vinculado a uma conta legitima e as
  configuracoes de Auth permitirem registrar/verificar esse endereco, alguem
  poderia obter acesso de gestao. As rotas permitem consultar dados de clientes
  e alterar estados de pedidos e pagamentos.
- Recomendacao: autorizar por UUID de usuario provisionado ou por papel
  confiavel em `app_metadata`, e revisar a politica de confirmacao de e-mail e
  o provisionamento de contas de equipe.
- Confianca: 8/10. A possibilidade de exploracao depende das configuracoes
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
