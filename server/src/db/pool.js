// =======================
// Pool de conexões com PostgreSQL
// =======================
import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

// Uma única pool reutilizada pela API evita abrir uma conexão nova em cada requisição.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    ca: env.databaseSslCa,
    rejectUnauthorized: true,
  },
  max: 10,
  idleTimeoutMillis: 30_000,
  // Supabase pode demorar alguns segundos para aceitar novas conexoes; evita timeout falso em rede lenta.
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (error) => {
  // Não registrar dados de requisições nem credenciais.
  console.error('Erro inesperado em uma conexão ociosa com o PostgreSQL:', error.message);
});
