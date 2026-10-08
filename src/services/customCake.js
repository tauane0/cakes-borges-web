// =======================
// Precos oficiais usados pelo questionario de bolo personalizado
// =======================
export async function fetchCustomCakeOptions() {
  const response = await fetch('/api/custom-cake');
  if (!response.ok) throw new Error('Nao foi possivel carregar os precos do bolo personalizado.');
  return response.json();
}
