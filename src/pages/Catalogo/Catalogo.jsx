import ProductCard from "../../components/ProductCard/ProductCard";
import "./Catalogo.css";

// =======================
// Estrutura compartilhada para vitrines de produtos
// =======================
function Catalogo({ id, eyebrow, titulo, chamada, produtos, catalogStatus = "loading", onAddToCart = () => {}, isCartSyncing = false, favoriteProducts = [], onToggleFavorite = () => {} }) {
  return (
    <section className={`catalog-section catalog-section-${id}`} id={id}>
      <div className="best-sellers-container">
        <div className="section-heading">
          <span className="section-eyebrow">{eyebrow}</span>
          <h2>{titulo}</h2>
          <p>{chamada}</p>
        </div>

        <div className="catalog-grid">
          {catalogStatus === "loading" && <p className="catalog-state" role="status">Carregando produtos...</p>}
          {catalogStatus === "error" && <p className="catalog-state" role="alert">Não foi possível carregar os produtos. Tente novamente mais tarde.</p>}
          {catalogStatus === "ready" && produtos.map((produto) => (
            <ProductCard key={produto.id} product={produto} onAddToCart={onAddToCart} isCartSyncing={isCartSyncing} isFavorite={favoriteProducts.some((item) => item.id === produto.id)} onToggleFavorite={onToggleFavorite} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Catalogo;
