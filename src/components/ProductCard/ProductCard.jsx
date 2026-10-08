import { useEffect, useRef, useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";

// Card de produto reutilizado nas vitrines, com ações de favorito e carrinho.
function ProductCard({ product, onAddToCart = () => {}, isCartSyncing = false, isFavorite = false, onToggleFavorite = () => {} }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addFailed, setAddFailed] = useState(false);
  const addedTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  async function addToCart() {
    if (adding || isCartSyncing) return;
    setAdded(false);
    setAddFailed(false);
    window.clearTimeout(addedTimer.current);
    setAdding(true);
    try {
      // So confirma visualmente depois que a atualizacao local ou do servidor foi concluida.
      const succeeded = await onAddToCart(product);
      setAddFailed(!succeeded);
      if (succeeded) {
        setAdded(true);
        window.clearTimeout(addedTimer.current);
        addedTimer.current = window.setTimeout(() => setAdded(false), 1600);
      } else {
        window.clearTimeout(addedTimer.current);
        addedTimer.current = window.setTimeout(() => setAddFailed(false), 2400);
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="product-card">
      <button
        className={`favorite-button${isFavorite ? " is-favorite" : ""}`}
        type="button"
        aria-label={isFavorite ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`}
        aria-pressed={isFavorite}
        onClick={() => onToggleFavorite(product)}
      >
        <Heart size={19} strokeWidth={1.8} fill={isFavorite ? "currentColor" : "none"} />
      </button>

      <div className="product-image">
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>

      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-rating" aria-label={`Avaliação ${product.rating} de 5, ${product.reviews} avaliações`}>
          <Star size={15} fill="currentColor" strokeWidth={1.5} />
          <strong>{product.rating}</strong>
          <span>({product.reviews})</span>
        </div>
        <div className="product-bottom">
          <strong className="product-price">{product.price}</strong>
          <button
            className={`add-cart-button${added ? " is-added" : ""}${addFailed ? " has-error" : ""}`}
            type="button"
            aria-label={added ? `${product.name} adicionado ao carrinho` : addFailed ? `Falha ao adicionar ${product.name}; tente novamente` : `Adicionar ${product.name} ao carrinho`}
            onClick={addToCart}
            disabled={adding || isCartSyncing}
          >
            <ShoppingCart size={17} />
            <span aria-live="polite">{isCartSyncing ? "Carregando..." : adding ? "Adicionando..." : added ? "Adicionado" : addFailed ? "Tentar novamente" : "Adicionar"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
