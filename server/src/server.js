// =======================
// Inicialização e encerramento organizado da API
// =======================
import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import process from 'node:process';

const server = app.listen(env.port, () => {
  console.log(`API Cakes Borges disponível na porta ${env.port}.`);
});

// Fecha o servidor HTTP e o pool ao encerrar o processo.
const shutdown = (signal) => {
  console.log(`Sinal ${signal} recebido; encerrando a API.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
