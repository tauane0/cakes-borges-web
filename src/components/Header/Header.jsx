import {
  Heart,
  UserRound,
  ShoppingCart,
  CakeSlice,
} from "lucide-react";

// Cabeçalho com navegação por âncoras e atalhos para as principais áreas da loja.
function Header({ cartCount = 0, favoriteCount = 0, onCartClick = () => {}, onFavoritesClick = () => {}, onAccountClick = () => {} }) {
  return (
    <header className="header">
      <div className="header-container">
        <a href="#home" className="logo" aria-label="Cakes Borges, página inicial">
          <div className="logo-icon"><CakeSlice size={32} strokeWidth={1.8} /></div>
          <div className="logo-text"><span className="logo-main">Cakes</span><span className="logo-script">Borges</span></div>
        </a>

        <nav className="navigation" aria-label="Navegação principal">
          <a href="#home" className="nav-link">Home</a>
          <a href="#sobre" className="nav-link">Sobre nós</a>
          <a href="#mais-vendidos" className="nav-link">Bolos</a>
          <a href="#complementos" className="nav-link">Complementos</a>
          <a href="#kits" className="nav-link">Kits</a>
          <a href="#monte-seu-bolo" className="nav-link">Monte seu bolo</a>
        </nav>

        <div className="header-actions">
          <button className="header-action favorite-header-button" type="button" onClick={onFavoritesClick} aria-label={`Abrir favoritos com ${favoriteCount} ${favoriteCount === 1 ? "item" : "itens"}`}><Heart size={21} strokeWidth={1.8} /><span className="favorite-count">{favoriteCount}</span></button>
          {/* Este atalho abre a conta Supabase ou permite entrar e sair. */}
          <button className="header-action account-header-button" type="button" onClick={onAccountClick} aria-label="Abrir login e cadastro"><UserRound size={21} strokeWidth={1.8} /></button>
          <button className="header-action cart-button" type="button" onClick={onCartClick} aria-label={`Abrir carrinho com ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}><ShoppingCart size={21} strokeWidth={1.8} /><span className="cart-count">{cartCount}</span></button>
        </div>
      </div>

      {/* Links compactos mantêm acessíveis no celular todas as seções principais da landing page. */}
      <nav className="mobile-category-navigation" aria-label="Categorias da loja">
        <a href="#home">Home</a>
        <a href="#sobre">Sobre nós</a>
        <a href="#mais-vendidos">Bolos</a>
        <a href="#complementos">Complementos</a>
        <a href="#kits">Kits</a>
        <a href="#monte-seu-bolo">Monte seu bolo</a>
      </nav>
    </header>
  );
}

export default Header;
