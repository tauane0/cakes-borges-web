// =======================
// Configuração e validação do ambiente
// =======================
import 'dotenv/config';
import process from 'node:process';

const port = Number(process.env.PORT || 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT precisa ser um número entre 1 e 65535.');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não foi definida. Copie .env.example para .env e configure o banco.');
}

export const env = {
  port,
  databaseUrl: process.env.DATABASE_URL,
  // O backend consulta Auth para validar cada JWT; a chave anon nunca substitui a chave do banco.
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  // Lista server-side de contas autorizadas a atualizar o andamento dos pedidos.
  orderManagerEmails: new Set((process.env.ORDER_MANAGER_EMAILS || '')
    .split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)),
  nodeEnv: process.env.NODE_ENV || 'development',
};
