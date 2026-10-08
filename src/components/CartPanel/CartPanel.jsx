import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { createWhatsAppLink } from "../../services/whatsapp";
import WhatsAppIcon from "../WhatsAppIcon/WhatsAppIcon";
import "./CartPanel.css";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
// =======================
// Normaliza precos em reais com virgula brasileira ou ponto decimal
// =======================
const getPrice = (item) => {
  if (typeof item.price === "number") return item.price;
  const rawPrice = String(item.price ?? "").replace(/[^\d,.-]/g, "");
  const normalizedPrice = rawPrice.includes(",")
    ? rawPrice.replaceAll(".", "").replace(",", ".")
    : rawPrice;
  return Number(normalizedPrice) || 0;
};

// =======================
// Carrinho visitante ou persistente e checkout de pedido Pix
// =======================
function CartPanel({ items, session, profile, error, onError, onClose, onChangeQuantity, onRemove, onSubmitOrder, onSignIn }) {
  const [checkingOut, setCheckingOut] = useState(false);
  const [sending, setSending] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [fulfillment, setFulfillment] = useState("RETIRADA");
  const [address, setAddress] = useState({ cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", pontoReferencia: "" });
  const subtotal = items.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);
  const orderWhatsAppLink = placedOrder && createWhatsAppLink(
    `Olá! Finalizei o pedido ${placedOrder.number} pelo site Cakes Borges. Pode confirmar o valor final${fulfillment === "ENTREGA" ? " com a taxa de entrega" : ""} e me enviar as instruções para pagamento via Pix?`,
  );

  async function submit(event) {
    event.preventDefault();
    onError(""); setSending(true);
    try { setPlacedOrder(await onSubmitOrder({ fulfillment, address })); }
    catch (requestError) { onError(requestError.message); }
    finally { setSending(false); }
  }

  return (
    <div className="cart-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="cart-panel-header"><div><span className="section-eyebrow">{placedOrder ? "Pedido recebido" : checkingOut ? "Quase la" : "Sua selecao"}</span><h2 id="cart-title">{placedOrder ? "Pedido" : checkingOut ? "Finalizar pedido" : "Carrinho"}</h2></div><button className="cart-close-button" type="button" onClick={onClose} aria-label="Fechar carrinho"><X /></button></div>
        {placedOrder ? (
          <div className="cart-order-success" role="status" aria-live="polite">
            <span className="cart-success-icon"><CheckCircle2 size={42} /></span>
            <h3>Pedido {placedOrder.number} registrado</h3>
            <p>O pedido esta pendente de pagamento Pix. A loja confirmara os dados de pagamento e a taxa de entrega, se houver.</p>
            <strong>Total: {money.format(Number(placedOrder.total))}</strong>
            {/* Abre o WhatsApp com o numero do pedido para a loja orientar o pagamento manual. */}
            {orderWhatsAppLink && <a className="cart-whatsapp-button" href={orderWhatsAppLink} target="_blank" rel="noreferrer"><WhatsAppIcon size={18} /> Continuar pelo WhatsApp</a>}
            <button className="cart-primary-button" type="button" onClick={onClose}>Voltar a loja</button>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty"><ShoppingBag size={38} /><h3>Seu carrinho esta vazio</h3><p>Adicione bolos, kits ou complementos para comecar.</p></div>
        ) : checkingOut ? (
          <form className="cart-checkout-form" onSubmit={submit}>
            <p className="cart-checkout-intro">Pedido para <strong>{profile?.name || session?.user?.email}</strong>. O pagamento sera via Pix.</p>
            <fieldset className="cart-delivery-options"><legend>Como deseja receber?</legend>
              <label><input type="radio" name="delivery" checked={fulfillment === "RETIRADA"} onChange={() => setFulfillment("RETIRADA")} /> Retirar no local</label>
              <label><input type="radio" name="delivery" checked={fulfillment === "ENTREGA"} onChange={() => setFulfillment("ENTREGA")} /> Receber por entrega</label>
            </fieldset>
            {fulfillment === "ENTREGA" && <div className="cart-address-fields">
              {[["cep","CEP"],["logradouro","Rua / avenida"],["numero","Numero"],["complemento","Complemento"],["bairro","Bairro"],["cidade","Cidade"],["estado","Estado (UF)"],["pontoReferencia","Ponto de referencia (opcional)"]].map(([key,label]) => <label className="cart-form-field" key={key}><span>{label}</span><input required={!['complemento','pontoReferencia'].includes(key)} maxLength={key === 'estado' ? 2 : 150} value={address[key]} onChange={(event) => setAddress((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
            </div>}
            <div className="cart-checkout-summary"><span>Subtotal ({items.reduce((count, item) => count + item.quantity, 0)} itens)</span><strong>{money.format(subtotal)}</strong></div>
            {fulfillment === "ENTREGA" && <p className="cart-demo-note">A taxa de entrega sera confirmada pela loja. O total exibido pode ser atualizado antes do pagamento.</p>}
            {error && <p className="cart-error" role="alert">{error}</p>}
            <div className="cart-checkout-actions"><button className="cart-secondary-button" type="button" onClick={() => setCheckingOut(false)}><ArrowLeft size={16} /> Voltar ao carrinho</button><button className="cart-primary-button" disabled={sending} type="submit">{sending ? "Enviando..." : "Registrar pedido Pix"}<ArrowRight size={16} /></button></div>
          </form>
        ) : <>
          {error && <p className="cart-error" role="alert">{error}</p>}
          <div className="cart-items">{items.map((item) => <article className="cart-item" key={item.lineId}>
            {item.image && <img src={item.image} alt="" />}
            <div className="cart-item-details"><div className="cart-item-title"><h3>{item.name}</h3><button type="button" onClick={() => onRemove(item.lineId)} aria-label={`Remover ${item.name}`}><Trash2 size={16} /></button></div>
              {item.configuration && <p className="cart-item-configuration">{[item.configuration.weight && `${item.configuration.weight} kg`, item.configuration.mass, item.configuration.fillings?.join(" + "), item.configuration.coverage, item.configuration.decoration, item.configuration.extras?.join(", ")].filter(Boolean).join(" · ")}</p>}
              {item.configuration?.notes && <p className="cart-item-configuration">Observacao: {item.configuration.notes}</p>}
              <div className="cart-item-footer"><div className="cart-quantity"><button type="button" onClick={() => onChangeQuantity(item.lineId, -1)} aria-label="Diminuir quantidade"><Minus size={14} /></button><span>{item.quantity}</span><button type="button" onClick={() => onChangeQuantity(item.lineId, 1)} aria-label="Aumentar quantidade"><Plus size={14} /></button></div><strong>{money.format(getPrice(item) * item.quantity)}</strong></div>
            </div>
          </article>)}</div>
          {/* Resumo e acao ficam sempre visiveis; apenas a lista de produtos rola. */}
          <div className="cart-footer">
            <div className="cart-total"><span>Subtotal</span><strong>{money.format(subtotal)}</strong></div>
            <p className="cart-demo-note">Pedido salvo como pendente; esta etapa nao confirma o pagamento Pix.</p>
            {!session ? <button className="cart-primary-button cart-begin-checkout" type="button" onClick={onSignIn}>Entrar para finalizar <ArrowRight size={16} /></button> : <button className="cart-primary-button cart-begin-checkout" type="button" onClick={() => setCheckingOut(true)}>Finalizar pedido <ArrowRight size={16} /></button>}
          </div>
        </>}
      </aside>
    </div>
  );
}

export default CartPanel;
