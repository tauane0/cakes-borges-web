# Cakes Borges

Projeto ficticio de e-commerce para uma confeitaria. O MVP combina uma vitrine feita com React e Vite, uma API Express e um banco PostgreSQL hospedado no Supabase.

## Recursos

- Vitrine de bolos, complementos e kits.
- Carrinho para visitantes e clientes autenticados.
- Login, cadastro, favoritos e historico de pedidos.
- Questionario para montar um bolo personalizado.
- Pedidos registrados como pendentes de pagamento Pix. O cliente pode solicitar os dados do Pix pelo WhatsApp; um funcionario confirma o pagamento manualmente.
- Layout responsivo para celular, tablet e desktop.

Os produtos, precos e avaliacoes sao dados demonstrativos. O projeto nao cobra Pix automaticamente e nao deve receber pedidos reais sem a configuracao comercial necessaria.

## Tecnologias

- Frontend: React, Vite e `@supabase/supabase-js` para autenticacao.
- Backend: Node.js, Express e `pg`.
- Banco: PostgreSQL no Supabase, com migracoes em `supabase/migrations/`.

## Requisitos

- Node.js compativel com a versao do Vite usada pelo projeto.
- Um projeto Supabase configurado para Auth e PostgreSQL.

## Configuracao local

### 1. Frontend

Na raiz do projeto, instale as dependencias e crie o arquivo local de ambiente:

```powershell
npm install
Copy-Item .env.example .env.local
```

Preencha `.env.local` com o Project URL, a chave anon/publicavel do Supabase e o telefone comercial do WhatsApp. Use apenas a chave publica no frontend; nunca coloque senha do banco, `service_role` ou chave secreta nesse arquivo.

Inicie o Vite na raiz:

```powershell
npm run dev
```

### 2. API

Em outro terminal, entre em `server`, instale as dependencias e crie o arquivo de ambiente:

```powershell
Set-Location server
npm install
Copy-Item .env.example .env
```

Configure `DATABASE_URL` com a URL Session Pooler do Supabase, `SUPABASE_URL` e a chave anon/publicavel do mesmo projeto. Mantenha a senha do banco somente em `server/.env`; nao compartilhe nem envie esse arquivo ao GitHub.

Inicie a API:

```powershell
npm run dev
```

A API fica em `http://localhost:3001`. O endpoint `GET /api/health` verifica a conexao com o banco. O Vite encaminha as chamadas `/api` para a API local.

## Banco de dados

As alteracoes do esquema ficam em `supabase/migrations/`. Os comandos de migracao sao executados a partir da raiz:

```powershell
npm run db:status
```

Revise o destino e as migracoes antes de aplicar alteracoes remotas. `npm run db:push` altera o banco Supabase vinculado; use-o somente depois de revisar o plano apresentado pela CLI.

## Verificacoes

Na raiz do projeto:

```powershell
npm run lint
npm run build
```

## Seguranca e configuracao

- Arquivos `.env`, `.env.local` e `server/.env` sao locais e ignorados pelo Git.
- Os arquivos `.env.example` contem apenas valores de exemplo e devem ser preenchidos localmente.
- Configure URLs de redirecionamento do Supabase Auth para o endereco local e para o dominio de producao quando houver hospedagem.
- Restrinja a gestao de pedidos a contas de funcionarios configuradas por UUID em `ORDER_MANAGER_USER_IDS` no ambiente da API.
- Antes de uma operacao real, defina precos, disponibilidade, taxa de entrega, prazo, endereco de retirada e processo de confirmacao do Pix.
