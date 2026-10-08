import Catalogo from "../Catalogo/Catalogo";

// =======================
// Vitrine de complementos recebidos da API
// =======================
function Complementos({ produtos = [], catalogStatus = "loading", onAddToCart, isCartSyncing = false, favoriteProducts, onToggleFavorite }) {
  return <Catalogo id="complementos" eyebrow="Para acompanhar" titulo="Complementos" chamada="Pequenos doces para completar a sua comemoração." produtos={produtos} catalogStatus={catalogStatus} onAddToCart={onAddToCart} isCartSyncing={isCartSyncing} favoriteProducts={favoriteProducts} onToggleFavorite={onToggleFavorite} />;
}

export default Complementos;
