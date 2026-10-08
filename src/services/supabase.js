// =======================
// Cliente publico do Supabase Auth
// =======================
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// As variaveis publicas habilitam Auth no navegador; nenhuma chave privilegiada pode ficar aqui.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export async function apiRequest(path, { session, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const requestError = new Error(body.error || 'Nao foi possivel concluir a solicitacao.');
    // A interface usa o código HTTP para diferenciar falta de permissão de falhas reais da API.
    requestError.status = response.status;
    throw requestError;
  }
  return response.status === 204 ? null : response.json();
}
