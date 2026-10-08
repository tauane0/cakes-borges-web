// =======================
// Acesso ao catálogo da API
// =======================
export async function fetchProducts({ signal } = {}) {
  const response = await fetch('/api/products', { signal });

  if (!response.ok) {
    throw new Error('Não foi possível carregar o catálogo.');
  }

  return response.json();
}
