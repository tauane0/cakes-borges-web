import { useState } from "react";
import ProductCard from "../ProductCard/ProductCard";

// =======================
// Vitrine de bolos em destaque carregados pela API
// =======================
function BestSellers({ products = [], catalogStatus = "loading", onAddToCart = () => {}, isCartSyncing = false, favoriteProducts = [], onToggleFavorite = () => {} }) {
  const [showAll, setShowAll] = useState(false);

  // Três cards formam uma linha completa no desktop; o botão revela a segunda linha.
  const visibleProducts = showAll ? products : products.slice(0, 3);

  return (
    <section className="best-sellers" id="mais-vendidos">
      <div className="best-sellers-container">
        <div className="section-heading">
          <span className="section-eyebrow">Favoritos da casa</span>
          <h2>Nossos <span>mais vendidos</span></h2>
          <p>Os sabores que conquistaram nossos clientes.</p>
        </div>

        <div className="products-grid" id="lista-de-bolos">
          {catalogStatus === "loading" && <p className="catalog-state" role="status">Carregando bolos...</p>}
          {catalogStatus === "error" && <p className="catalog-state" role="alert">Não foi possível carregar os bolos. Tente novamente mais tarde.</p>}
          {catalogStatus === "ready" && visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} isCartSyncing={isCartSyncing} isFavorite={favoriteProducts.some((item) => item.id === product.id)} onToggleFavorite={onToggleFavorite} />
          ))}
        </div>

        {products.length > 3 && (
          <div className="products-footer">
            {/* Alterna a lista sem sair da seção e anuncia o estado para leitores de tela. */}
            <button type="button" className="view-all-button" aria-expanded={showAll} aria-controls="lista-de-bolos" onClick={() => setShowAll((current) => !current)}>
              {showAll ? "Ver menos ↑" : "Ver todos os bolos →"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default BestSellers;
