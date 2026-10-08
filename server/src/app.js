// =======================
// Configuração principal do Express
// =======================
import express from 'express';
import { healthRouter } from './routes/health.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { accountRouter } from './routes/account.routes.js';

export const app = express();

// Limite simples evita que a API aceite corpos de requisição excessivamente grandes.
app.use(express.json({ limit: '100kb' }));

// =======================
// Rotas públicas da API
// =======================
app.use('/api', healthRouter);
app.use('/api', productsRouter);
app.use('/api', accountRouter);

// =======================
// Tratamento de rota inexistente e erros
// =======================
app.use((_request, response) => {
  response.status(404).json({ error: 'Rota não encontrada.' });
});

app.use((error, _request, response, next) => {
  void next;
  // Detalhes internos ficam apenas no terminal; a resposta não expõe stack trace.
  // O log mostra apenas classe, codigo e mensagem da falha; nunca inclui env, SQL bindings ou headers.
  console.error('Falha na API:', { name: error?.name, code: error?.code, message: error?.message || String(error) });
  response.status(error.status || 500).json({ error: error.status ? error.message : 'Não foi possível concluir a solicitação.' });
});
