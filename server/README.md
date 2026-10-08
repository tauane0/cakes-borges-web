# API Cakes Borges

## Estrutura do backend

A API usa Express e conecta diretamente ao PostgreSQL gerenciado pelo Supabase com `pg`. O frontend nao recebe a senha do banco: a URL fica em `server/.env` e so e lida pelo servidor Node.

## Preparar o projeto Supabase

1. Crie um projeto no painel do Supabase.
2. No painel, abra **Connect** e copie a URL de conexao **Session pooler** para um backend persistente quando a rede local for IPv4. Use a URL mostrada pelo painel; substitua a senha e codifique caracteres especiais dela.
3. Copie `server/.env.example` para `server/.env` e coloque essa URL em `DATABASE_URL`. O exemplo exige conexão SSL e usa a compatibilidade do driver `pg`; antes de produção, configure a CA do Supabase para verificar o certificado do servidor. Nunca envie `server/.env` ao Git.
4. Na raiz do repositorio, execute `npm install` para instalar a Supabase CLI. Na pasta `server`, execute `npm install` para instalar as dependencias da API.
5. Na raiz, autentique a CLI com `npx supabase login` e vincule o projeto com `npm run db:link`.
6. Revise as migracoes pendentes com `npm run db:status`. Quando estiver pronto para criar as tabelas no projeto remoto, execute `npm run db:push`.
7. Inicie a API dentro de `server` com `npm run dev`. A rota `GET /api/health` verifica a conexao com o banco.

A migracao remota e uma alteracao no banco Supabase. O projeto Cakes Borges esta vinculado ao projeto `cakes_borges`; antes de aplicar futuras migracoes, confira `npm run db:status` para confirmar o destino e revisar o que sera aplicado.

## Catálogo inicial

A migração `20261006124711_catalog_sale_units.sql` acrescenta os dados fictícios usados nas vitrines: seis bolos, seis complementos e três kits. Os valores dos bolos seguem a vitrine “Mais vendidos” e usam a opção base de 1 kg; caixas são vendidas em grupos de 25 unidades, itens avulsos por unidade e kits por kit. Avaliações e contagens também são dados demonstrativos.

`GET /api/products` retorna o catálogo. Os filtros opcionais `category=bolos`, `category=complementos` ou `category=kits` limitam por categoria; `featured=true` retorna somente os itens em destaque.

No desenvolvimento local, o Vite encaminha `/api` para `http://localhost:3001`. Rode a interface na raiz do projeto e a API na pasta `server`, cada uma em seu próprio terminal. Em produção, configure o domínio da API e a validação do certificado SSL para o ambiente de hospedagem.

## Auth, conta, favoritos e pedidos

1. Na raiz, copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com o Project URL e a chave publicavel/anon do mesmo projeto Supabase. Essa chave e feita para o navegador; nunca use `service_role` ou uma secret key no frontend.
2. Em `server/.env`, preencha tambem `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os mesmos valores. A senha do PostgreSQL continua apenas em `DATABASE_URL` no servidor.
   Para habilitar a gestão de pedidos, configure `ORDER_MANAGER_EMAILS` com o e-mail exato da conta autorizada. Separe vários e-mails por vírgula. Essa permissão é conferida pelo backend e nunca deve ser colocada em `user_metadata` editável pelo cliente.
3. No painel Supabase, confira as configuracoes de Auth por e-mail e a URL permitida para desenvolvimento (`http://localhost:5173`). Se confirmacao de e-mail estiver ativa, o cliente precisa abrir o link enviado antes de entrar.
4. Reinicie a API e o Vite depois de editar os arquivos de ambiente.

O servidor valida o bearer token no Supabase Auth e associa a conta a `usuario.auth_user_id`. Nome e telefone/WhatsApp do cadastro viram dados de perfil; os metadados editaveis do usuario nao autorizam operacoes. Favoritos e carrinho autenticado ficam no banco; o carrinho local de visitante e mesclado ao entrar. Itens iguais em produto, opcao de peso/preco, configuracao e observacoes somam quantidade.

O checkout exige login, registra pedido e itens com snapshot dos precos, endereco de entrega quando aplicavel e status de pagamento `PENDENTE` via Pix. Nao ha cobranca, confirmacao automatica ou chave Pix configurada. `DELIVERY_FEE` fica como `0` ate a loja definir a taxa; confirme a taxa com a pessoa antes de receber pedidos reais. Os precos e produtos atuais sao demonstrativos.

O cliente acompanha o status e o histórico no painel da conta e pode atualizar a lista manualmente. A equipe autorizada em `ORDER_MANAGER_EMAILS` pode confirmar o Pix recebido, avançar o pedido (confirmado, em preparo, pronto e concluído) ou cancelá-lo. As mudanças e observações são registradas em `pedido_status_historico`. As tabelas públicas seguem com RLS ativada e sem acesso direto do navegador; as rotas privadas da API verificam a sessão, filtram os pedidos do cliente pela própria conta e protegem as operações da equipe por uma lista privada do servidor.

## Migracoes

As migracoes ficam em `supabase/migrations/` com prefixo de data/hora. Para criar outra, use na raiz `npm run db:migration:new -- nome_da_mudanca`; edite o SQL gerado e aplique as alteracoes pelo fluxo da Supabase CLI. Depois que esse fluxo estiver estabelecido, evite editar o esquema remoto pelo painel sem registrar uma migracao correspondente, para nao dessincronizar o historico.

A migracao `20261005210000_initial_schema.sql` cria contas, catalogo, precos, personalizacoes, favoritos, carrinhos, enderecos e pedidos. A migracao `20261006132559_auth_cart_orders.sql` liga perfis ao Supabase Auth, registra precos e configuracoes nos itens e inclui os precos do bolo personalizado. O arquivo de rollback esta em `supabase/rollback/initial_schema.sql`, fora da pasta monitorada pela CLI, porque sua execucao remove tabelas e dados.

A regra aprovada para unir carrinhos ainda sera implementada no servico de carrinho: itens com o mesmo produto, peso, opcoes (incluindo ordem) e observacoes somam quantidades; configuracoes diferentes continuam separadas.

O pagamento inicial do MVP fica restrito a Pix. Esta etapa ainda nao integra provedor de pagamento nem confirma pagamentos automaticamente.
