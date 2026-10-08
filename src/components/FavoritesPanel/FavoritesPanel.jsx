import { Heart, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";
import "./FavoritesPanel.css";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Lista os favoritos e oferece ações para remover ou adicionar itens ao carrinho.
function FavoritesPanel({ products, onClose, onRemove, onAddToCart, signedIn = false, onSignIn = () => {} }) {
  return (
    <div className="favorites-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="favorites-panel" role="dialog" aria-modal="true" aria-labelledby="favorites-title">
        <div className="favorites-panel-header">
          <div><span className="section-eyebrow">Seus escolhidos</span><h2 id="favorites-title">Favoritos</h2></div>
          <button className="favorites-close-button" type="button" onClick={onClose} aria-label="Fechar favoritos"><X /></button>
        </div>

        {products.length === 0 ? (
          <div className="favorites-empty"><Heart size={38} /><h3>Nenhum favorito por enquanto</h3><p>Toque no coração de um produto para guardá-lo aqui.</p></div>
        ) : (
          <div className="favorites-list">
            {products.map((product) => (
              <article className="favorite-item" key={product.id}>
                <img src={product.image} alt={product.name} />
                <div className="favorite-item-info">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <strong>{typeof product.price === "number" ? money.format(product.price) : product.price}</strong>
                  <div className="favorite-item-actions">
                    <button className="favorite-add-button" type="button" onClick={() => onAddToCart(product)}><ShoppingCart size={15} /> Adicionar ao carrinho</button>
                    <button className="favorite-remove-button" type="button" onClick={() => onRemove(product.id)} aria-label={`Remover ${product.name} dos favoritos`}><Trash2 size={15} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="favorites-note"><ShoppingBag size={14} /> {signedIn ? "Seus favoritos estao associados a sua conta." : "Entre ou crie uma conta para levar estes favoritos entre dispositivos."}</p>
        {!signedIn && <button className="favorite-add-button" type="button" onClick={onSignIn}>Entrar ou criar conta</button>}
      </aside>
    </div>
  );
}

export default FavoritesPanel;
