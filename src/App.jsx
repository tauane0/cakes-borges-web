import { useEffect, useState } from "react";
import Header from "./components/Header/Header";
import Hero from "./components/Hero/Hero";
import Benefits from "./components/Benefits/Benefits";
import BestSellers from "./components/BestSellers/BestSellers";
import CustomCake from "./components/CustomCake/CustomCake";
import AboutStore from "./components/AboutStore/AboutStore";
import Testimonials from "./components/Testimonials/Testimonials";
import Newsletter from "./components/Newsletter/Newsletter";
import Kits from "./pages/Kits/Kits";
import Complementos from "./pages/Complementos/Complementos";
import CartPanel from "./components/CartPanel/CartPanel";
import FavoritesPanel from "./components/FavoritesPanel/FavoritesPanel";
import AccountPanel from "./components/AccountPanel/AccountPanel";
import WhatsAppButton from "./components/WhatsAppButton/WhatsAppButton";
import { fetchProducts } from "./services/products";
import { apiRequest, supabase } from "./services/supabase";

const CART_KEY = "cakes-borges-guest-cart";
const FAVORITES_KEY = "cakes-borges-guest-favorites";

// Lê os dados locais com tolerância a JSON corrompido para não impedir a tela inicial de renderizar.
function readStoredItems(key) {
  try {
    const storedItems = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(storedItems) ? storedItems : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

// Garante identificadores e quantidades válidos nos carrinhos salvos por versões anteriores.
function readStoredCart() {
  return readStoredItems(CART_KEY).map((item) => ({
    ...item,
    lineId: item.lineId || crypto.randomUUID(),
    quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
  }));
}

// =======================
// Catalogo, sessao e dados compartilhados da loja
// =======================
function App() {
  const [products, setProducts] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [cartItems, setCartItems] = useState(readStoredCart);
  const [favoriteItems, setFavoriteItems] = useState(() => readStoredItems(FAVORITES_KEY));
  const [session, setSession] = useState(null);
  const [isCartSyncing, setIsCartSyncing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [accountError, setAccountError] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts({ signal: controller.signal }).then((items) => { setProducts(items); setCatalogStatus("ready"); })
      .catch((error) => { if (error.name !== "AbortError") setCatalogStatus("error"); });
    return () => controller.abort();
  }, []);

  // ============================================================================================
  // Supabase mantém e renova a sessao; a API recebe o access token e valida o usuario no servidor.
  // ============================================================================================
  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setIsCartSyncing(Boolean(data.session));
      setSession(data.session);
      if (!data.session) { setUserProfile(null); setOrders([]); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setIsCartSyncing(Boolean(nextSession));
      setSession(nextSession);
      if (!nextSession) { setUserProfile(null); setOrders([]); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ============================================================================================
  // Ao entrar, associa o perfil, carrega dados privados e une o carrinho local ao da conta.
  // ======================== ====================================================================

  useEffect(() => {
    if (!session) return undefined;
    let active = true;
    (async () => {
      try {
        const [profile, savedFavorites, recentOrders] = await Promise.all([
          apiRequest("/me", { session }), apiRequest("/favorites", { session }), apiRequest("/orders", { session }),
        ]);
        if (!active) return;
        setUserProfile(profile);
        setOrders(recentOrders);
        let favorites = savedFavorites;
        const guestFavorites = readStoredItems(FAVORITES_KEY);
        for (const favorite of guestFavorites) {
          if (!favorites.some((item) => item.id === favorite.id)) {
            await apiRequest(`/favorites/${favorite.id}`, { session, method: "POST" });
            favorites = [...favorites, favorite];
          }
        }
        setFavoriteItems(favorites);
        localStorage.removeItem(FAVORITES_KEY);
        const guestCart = readStoredCart();
        // Busca o estado mais recente depois da mesclagem para nao sobrescrever um clique recente com um carrinho antigo.
        const latestCart = guestCart.length
          ? await apiRequest("/cart/merge", { session, method: "POST", body: JSON.stringify({ items: guestCart }) })
          : await apiRequest("/cart", { session });
        if (active) { localStorage.removeItem(CART_KEY); setCartItems(latestCart); }
      } catch (error) { if (active) setAccountError(error.message); }
      finally { if (active) setIsCartSyncing(false); }
    })();
    return () => { active = false; };
  }, [session]);

  // =================================================================================================
  // Carrinho e favoritos de visitante sobrevivem ao refresh; contas usam os registros do servidor.
//======================================================================================================

  useEffect(() => { if (!session) localStorage.setItem(CART_KEY, JSON.stringify(cartItems)); }, [cartItems, session]);
  useEffect(() => { if (!session) localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteItems)); }, [favoriteItems, session]);

  const featuredCakes = products.filter((product) => product.categorySlug === "bolos" && product.featured);
  const complements = products.filter((product) => product.categorySlug === "complementos");
  const kits = products.filter((product) => product.categorySlug === "kits");

  async function addToCart(product) {
    // Aguarda o carrinho da conta terminar de carregar antes de aceitar novos itens.
    if (session && isCartSyncing) {
      setAccountError("Aguarde o carregamento do carrinho e tente novamente.");
      return false;
    }
    const normalized = { ...product, lineId: product.lineId || crypto.randomUUID(), quantity: 1 };
    setAccountError("");
    try {
      if (session) {
        const updated = await apiRequest("/cart/merge", { session, method: "POST", body: JSON.stringify({ items: [normalized] }) });
        setCartItems(updated);
      } else {
        // Visitantes veem o mesmo comportamento da conta: itens iguais somam quantidade na mesma linha.
        setCartItems((items) => {
          const matchingIndex = items.findIndex((item) => item.id === normalized.id
            && item.priceOptionId === normalized.priceOptionId
            && JSON.stringify(item.configuration || {}) === JSON.stringify(normalized.configuration || {}));
          if (matchingIndex < 0) return [...items, normalized];
          return items.map((item, index) => index === matchingIndex
            ? { ...item, quantity: Math.min(99, Number(item.quantity) + 1) }
            : item);
        });
      }
      return true;
    } catch (error) {
      setAccountError(error.message);
      return false;
    }
  }

  async function toggleFavorite(product) {
    try {
      if (session) {
        const isSaved = favoriteItems.some((item) => item.id === product.id);
        await apiRequest(`/favorites/${product.id}`, { session, method: isSaved ? "DELETE" : "POST" });
        setFavoriteItems((items) => isSaved ? items.filter((item) => item.id !== product.id) : [...items, product]);
      } else setFavoriteItems((items) => items.some((item) => item.id === product.id) ? items.filter((item) => item.id !== product.id) : [...items, product]);
    } catch (error) { setAccountError(error.message); setIsAccountOpen(true); }
  }

  async function changeCartQuantity(lineId, change) {
    const item = cartItems.find((line) => line.lineId === lineId);
    if (!item) return;
    setAccountError("");
    try {
      // Envia a diferença para o backend; assim cliques rápidos não sobrescrevem uns aos outros.
      if (session) {
        await apiRequest(`/cart/items/${lineId}`, { session, method: "PATCH", body: JSON.stringify({ change }) });
      }
      setCartItems((items) => items.flatMap((line) => {
        if (line.lineId !== lineId) return [line];
        const quantity = Math.max(0, Math.min(99, Number(line.quantity) + change));
        return quantity > 0 ? [{ ...line, quantity }] : [];
      }));
    } catch (error) {
      setAccountError(error.message);
    }
  }

  async function removeCartItem(lineId) {
    if (session) await apiRequest(`/cart/items/${lineId}`, { session, method: "DELETE" });
    setCartItems((items) => items.filter((item) => item.lineId !== lineId));
  }

  async function submitOrder(details) {
    if (!session) { setIsCartOpen(false); setIsAccountOpen(true); throw new Error("Entre na sua conta para finalizar o pedido."); }
    const order = await apiRequest("/orders", { session, method: "POST", body: JSON.stringify(details) });
    setCartItems([]);
    setOrders((current) => [order, ...current]);
    return order;
  }

  // Permite atualizar o histórico depois que a loja altera o status do pedido.
  async function refreshOrders() {
    if (!session) return;
    const latestOrders = await apiRequest("/orders", { session });
    setOrders(latestOrders);
    return latestOrders;
  }

  return (
    <>
      <Header cartCount={cartCount} favoriteCount={favoriteItems.length} onCartClick={() => setIsCartOpen(true)} onFavoritesClick={() => setIsFavoritesOpen(true)} onAccountClick={() => setIsAccountOpen(true)} />
      <main>
        <Hero />
        <AboutStore />
        <Benefits />
        {/* Mantem os botoes indisponiveis ate o carrinho autenticado terminar de sincronizar. */}
        <BestSellers products={featuredCakes} catalogStatus={catalogStatus} onAddToCart={addToCart} isCartSyncing={isCartSyncing} favoriteProducts={favoriteItems} onToggleFavorite={toggleFavorite} />
        <Complementos produtos={complements} catalogStatus={catalogStatus} onAddToCart={addToCart} isCartSyncing={isCartSyncing} favoriteProducts={favoriteItems} onToggleFavorite={toggleFavorite} />
        <Kits produtos={kits} catalogStatus={catalogStatus} onAddToCart={addToCart} isCartSyncing={isCartSyncing} favoriteProducts={favoriteItems} onToggleFavorite={toggleFavorite} />
        <CustomCake onAddToCart={addToCart} products={products} />
        <Testimonials /><Newsletter />
      </main>
      <WhatsAppButton />
      {isCartOpen && <CartPanel items={cartItems} session={session} profile={userProfile} error={accountError} onError={setAccountError} onClose={() => setIsCartOpen(false)} onChangeQuantity={changeCartQuantity} onRemove={removeCartItem} onSubmitOrder={submitOrder} onSignIn={() => { setIsCartOpen(false); setIsAccountOpen(true); }} />}
      {isFavoritesOpen && <FavoritesPanel products={favoriteItems} onClose={() => setIsFavoritesOpen(false)} onRemove={(productId) => toggleFavorite({ id: productId })} onAddToCart={addToCart} signedIn={Boolean(session)} onSignIn={() => { setIsFavoritesOpen(false); setIsAccountOpen(true); }} />}
      {isAccountOpen && <AccountPanel session={session} profile={userProfile} orders={orders} onRefreshOrders={refreshOrders} initialError={accountError} onClose={() => { setIsAccountOpen(false); setAccountError(""); }} onSignOut={() => supabase?.auth.signOut()} />}
    </>
  );
}

export default App;
