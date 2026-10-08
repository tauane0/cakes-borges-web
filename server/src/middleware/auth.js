// =======================
// Validacao de sessao do Supabase Auth
// =======================
import { env } from '../config/env.js';

export async function requireAuth(request, response, next) {
  const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return response.status(401).json({ error: 'Entre na sua conta para continuar.' });
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return response.status(503).json({ error: 'Configure a autenticacao Supabase no servidor.' });
  }

  try {
    const result = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { apikey: env.supabaseAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return response.status(401).json({ error: 'Sua sessao expirou. Entre novamente.' });
    const user = await result.json();
    if (!user.id || !user.email) return response.status(401).json({ error: 'Sessao invalida.' });
    request.authUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
