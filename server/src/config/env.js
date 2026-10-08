// =======================
// Configuração e validação do ambiente
// =======================
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT precisa ser um número entre 1 e 65535.');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não foi definida. Copie .env.example para .env e configure o banco.');
}

const databaseUrl = process.env.DATABASE_URL;
let parsedDatabaseUrl;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch (error) {
  throw new Error('DATABASE_URL precisa ser uma URL PostgreSQL válida.', { cause: error });
}
if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
  throw new Error('DATABASE_URL precisa usar o protocolo PostgreSQL.');
}
const sslConnectionOptions = ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'sslpassword'];
if ([...parsedDatabaseUrl.searchParams.keys()].some((key) => sslConnectionOptions.includes(key.toLowerCase()))) {
  throw new Error('Remova os parâmetros SSL de DATABASE_URL; a API configura TLS com validação de certificado.');
}

const databaseSslCaPath = process.env.DATABASE_SSL_CA_PATH;
if (!databaseSslCaPath) {
  throw new Error('DATABASE_SSL_CA_PATH não foi definida. Configure o certificado raiz SSL do Supabase.');
}
const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const resolvedDatabaseSslCaPath = resolve(serverRoot, databaseSslCaPath);
const databaseSslCa = readFileSync(resolvedDatabaseSslCaPath, 'utf8');
if (!/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/.test(databaseSslCa)) {
  throw new Error(`DATABASE_SSL_CA_PATH não contém um certificado PEM válido: ${resolvedDatabaseSslCaPath}`);
}

const orderManagerUserIds = (process.env.ORDER_MANAGER_USER_IDS || '')
  .split(',')
  .map((userId) => userId.trim().toLowerCase())
  .filter(Boolean);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (orderManagerUserIds.some((userId) => !uuidPattern.test(userId))) {
  throw new Error('ORDER_MANAGER_USER_IDS deve conter UUIDs de usuários Supabase válidos, separados por vírgula.');
}

export const env = {
  port,
  databaseUrl,
  databaseSslCa,
  // O backend consulta Auth para validar cada JWT; a chave anon nunca substitui a chave do banco.
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  // Lista server-side de UUIDs de contas autorizadas a gerenciar pedidos.
  orderManagerUserIds: new Set(orderManagerUserIds),
  nodeEnv: process.env.NODE_ENV || 'development',
};
