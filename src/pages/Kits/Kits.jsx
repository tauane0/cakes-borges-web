import Catalogo from "../Catalogo/Catalogo";

// =======================
// Vitrine de kits recebidos da API
// =======================
function Kits({ produtos = [], catalogStatus = "loading", onAddToCart, isCartSyncing = false, favoriteProducts, onToggleFavorite }) {
  return <Catalogo id="kits" eyebrow="Para compartilhar" titulo="Kits" chamada="Combinações prontas para deixar a comemoração completa." produtos={produtos} catalogStatus={catalogStatus} onAddToCart={onAddToCart} isCartSyncing={isCartSyncing} favoriteProducts={favoriteProducts} onToggleFavorite={onToggleFavorite} />;
}

export default Kits;
