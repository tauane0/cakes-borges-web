import { useEffect, useState } from "react";
import { ArrowRight, CakeSlice, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound, X } from "lucide-react";
import WhatsAppIcon from "../WhatsAppIcon/WhatsAppIcon";
import { createWhatsAppLink } from "../../services/whatsapp";
import { apiRequest, supabase } from "../../services/supabase";
import "./AccountPanel.css";

// =======================
// Estados visíveis e sequência permitida para acompanhar pedidos
// =======================
const orderStatusLabels = {
  PENDENTE: "Aguardando confirmação",
  CONFIRMADO: "Confirmado",
  EM_PRODUCAO: "Em preparo",
  PRONTO: "Pronto para retirada ou entrega",
  ENTREGUE: "Concluído",
  CANCELADO: "Cancelado",
};

const nextOrderStatuses = {
  PENDENTE: "CONFIRMADO",
  CONFIRMADO: "EM_PRODUCAO",
  EM_PRODUCAO: "PRONTO",
  PRONTO: "ENTREGUE",
};

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

// =======================
// Login e cadastro reais via Supabase Auth
// =======================
function AccountPanel({ onClose, onSignOut, session, profile, orders = [], onRefreshOrders, initialError = "" }) {
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [confirmationRequested, setConfirmationRequested] = useState(false);
  const [orderView, setOrderView] = useState("customer");
  const [managedOrders, setManagedOrders] = useState([]);
  const [orderManagerUserId, setOrderManagerUserId] = useState("");
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [fields, setFields] = useState({ name: "", email: "", phone: "", password: "", passwordConfirmation: "" });
  const isRegistering = mode === "register";
  // A permissão fica ligada ao usuário da sessão atual, nunca apenas a um estado antigo do modal.
  const isOrderManager = Boolean(session?.user?.id && orderManagerUserId === session.user.id);
  const showingManagerOrders = isOrderManager && orderView === "manager";

  // A API libera a área da loja apenas para e-mails autorizados no ambiente privado do servidor.
  useEffect(() => {
    if (!session) return undefined;
    let active = true;
    apiRequest("/orders/manage", { session })
      .then((staffOrders) => {
        if (!active) return;
        setManagedOrders(staffOrders);
        setOrderManagerUserId(session.user.id);
      })
      .catch((requestError) => {
        if (active && requestError.status !== 403) setManagerError(requestError.message);
      });
    return () => { active = false; };
  }, [session]);

  async function reloadOrders() {
    if (!onRefreshOrders) return;
    setRefreshingOrders(true);
    setManagerError("");
    try { await onRefreshOrders(); }
    catch (requestError) { setManagerError(requestError.message); }
    finally { setRefreshingOrders(false); }
  }

  async function reloadManagedOrders() {
    setManagerLoading(true);
    setManagerError("");
    try { setManagedOrders(await apiRequest("/orders/manage", { session })); }
    catch (requestError) { setManagerError(requestError.message); }
    finally { setManagerLoading(false); }
  }

  async function updateManagedOrder(orderId, changes) {
    setUpdatingOrderId(orderId);
    setManagerError("");
    try {
      const updatedOrder = await apiRequest(`/orders/manage/${orderId}`, {
        session,
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      // Atualiza a tela de gestão imediatamente e depois sincroniza os históricos dos dois painéis.
      setManagedOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...updatedOrder } : order));
      const [staffOrders] = await Promise.all([
        apiRequest("/orders/manage", { session }),
        onRefreshOrders?.(),
      ]);
      setManagedOrders(staffOrders);
    } catch (requestError) {
      setManagerError(requestError.message);
    } finally {
      setUpdatingOrderId("");
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
    setError("");
    setMessage("");
    if (name === "email") { setConfirmationRequested(false); setNeedsConfirmation(false); }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!supabase) { setError("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local."); return; }
    if (isRegistering && fields.password !== fields.passwordConfirmation) { setError("As senhas nao coincidem."); return; }
    setBusy(true); setError("");
    try {
      if (isRegistering) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: fields.email.trim(), password: fields.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fields.name.trim(), phone: fields.phone.trim() },
          },
        });
        if (authError) throw authError;
        if (!data.session) setMessage("Cadastro criado. Confirme o link enviado ao e-mail; depois entre na conta. Se o link vencer, use o reenvio na tela de login.");
        else setMessage("Conta criada com sucesso.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: fields.email.trim(), password: fields.password });
        if (authError) throw authError;
        setMessage("Login realizado.");
      }
    } catch (requestError) {
      const authMessage = requestError.message || "Nao foi possivel autenticar.";
      const isUnconfirmed = requestError.code === "email_not_confirmed" || /email not confirmed/i.test(authMessage);
      const isRateLimited = /rate limit/i.test(authMessage);
      setNeedsConfirmation(isUnconfirmed || (isRegistering && isRateLimited));
      setError(isRateLimited
        ? "O Supabase limitou temporariamente o envio de e-mails. Aguarde antes de pedir outra mensagem; nao tente criar a conta novamente."
        : authMessage);
    }
    finally { setBusy(false); }
  }

  // Reenvia a confirmacao para a conta pendente sem tentar cadastrar o mesmo e-mail novamente.
  async function resendConfirmation() {
    if (!supabase || !fields.email.trim() || confirmationRequested) return;
    setResendingConfirmation(true); setError(""); setMessage("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: fields.email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (resendError) throw resendError;
      setConfirmationRequested(true);
      setMessage("Pedido de reenvio feito. Confira sua caixa de entrada e a pasta de spam.");
    } catch (requestError) {
      const isRateLimited = /rate limit/i.test(requestError.message || "");
      // So desabilitamos o botao depois de um reenvio aceito; uma recusa por cota pode ser tentada mais tarde.
      setConfirmationRequested(false);
      setError(isRateLimited
        ? "O limite de envio foi atingido. Aguarde pelo menos uma hora desde o ultimo e-mail e tente reenviar uma vez. A tela nao consegue consultar o tempo restante do Supabase."
        : requestError.message || "Nao foi possivel reenviar a confirmacao.");
    } finally { setResendingConfirmation(false); }
  }

  // Renderiza o painel de login/cadastro, ou a tela de sucesso se o usuário estiver logado.
  return (
    <div className="account-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`account-modal${isRegistering ? " is-registering" : ""}`} role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button className="account-close" type="button" onClick={onClose} aria-label="Fechar login e cadastro"><X size={20} /></button>
        <div className="account-welcome">
          <span className="account-brand-icon"><CakeSlice size={34} strokeWidth={1.5} /></span>
          <span className="account-eyebrow">Cakes <em>Borges</em></span>
          <h2>Um cantinho doce, feito para voce.</h2>
          <p>Acesse sua conta para acompanhar pedidos, guardar favoritos e concluir suas compras.</p>
          <div className="account-decoration" aria-hidden="true"><span /><span /><span /></div>
        </div>
        <div className="account-form-area">
          {session ? (
            <div className="account-success" role="status">
              <CheckCircle2 size={48} />
              <h1 id="account-title">Ola, {profile?.name || session.user.email}</h1>
              <p>{profile?.email || session.user.email}<br />{profile?.phone || session.user.user_metadata?.phone}</p>
              <div className="account-order-history" aria-label="Acompanhamento dos pedidos">
                <div className="account-orders-heading">
                  <h2>{showingManagerOrders ? "Pedidos da loja" : "Seus pedidos"}</h2>
                  <button type="button" onClick={showingManagerOrders ? reloadManagedOrders : reloadOrders} disabled={refreshingOrders || (managerLoading && showingManagerOrders)}>
                    {refreshingOrders || (managerLoading && showingManagerOrders) ? "Atualizando..." : "Atualizar"}
                  </button>
                </div>
                {isOrderManager && <div className="account-orders-tabs" role="group" aria-label="Visualização dos pedidos">
                  <button type="button" className={orderView === "customer" ? "is-active" : ""} onClick={() => setOrderView("customer")}>Meus pedidos</button>
                  <button type="button" className={orderView === "manager" ? "is-active" : ""} onClick={() => setOrderView("manager")}>Gerenciar loja</button>
                </div>}
                {managerError && <p className="account-error" role="alert">{managerError}</p>}
                {!showingManagerOrders ? (
                  orders.length ? orders.slice(0, 5).map((order) => {
                    const pixMessage = `Olá! Fiz o pedido ${order.number} no site Cakes Borges, no valor de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(order.total))}. Pode me enviar os dados para pagamento via Pix?`;
                    const pixWhatsAppLink = order.paymentStatus === "PENDENTE" && order.status !== "CANCELADO"
                      ? createWhatsAppLink(pixMessage)
                      : "";

                    return <article className="account-order-card" key={order.id}>
                      <div className="account-order-card-heading"><strong>Pedido {order.number}</strong><b>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(order.total))}</b></div>
                      <p>{orderStatusLabels[order.status] || order.status} · Pix {order.paymentStatus === "PAGO" ? "pago" : order.paymentStatus === "CANCELADO" ? "cancelado" : "pendente"}</p>
                      <small>{formatDateTime(order.createdAt)} · {order.fulfillment === "ENTREGA" ? "Entrega" : "Retirada"}</small>
                      {/* O cliente solicita as instrucoes pelo WhatsApp; somente a equipe confirma o Pix no painel. */}
                      {pixWhatsAppLink && <a className="account-order-whatsapp" href={pixWhatsAppLink} target="_blank" rel="noreferrer"><WhatsAppIcon size={16} /> Pedir dados do Pix pelo WhatsApp</a>}
                      {!!order.statusHistory?.length && <ol className="account-order-timeline">
                        {order.statusHistory.map((entry, index) => <li key={`${entry.createdAt}-${index}`}>
                          <span><strong>{orderStatusLabels[entry.status] || entry.status}</strong>{entry.observation && <small>{entry.observation}</small>}</span>
                          <time>{formatDateTime(entry.createdAt)}</time>
                        </li>)}
                      </ol>}
                    </article>;
                  }) : <p>Você ainda não tem pedidos.</p>
                ) : (
                  managerLoading ? <p>Carregando pedidos da loja...</p> : <>
                    <p className="account-manager-note">Confirme o Pix somente depois de verificar o recebimento na conta da loja.</p>
                    {managedOrders.length ? managedOrders.map((order) => {
                    const nextStatus = nextOrderStatuses[order.status];
                    const isUpdating = updatingOrderId === order.id;
                    return <article className="account-order-card account-managed-order" key={order.id}>
                      <div className="account-order-card-heading"><strong>Pedido {order.number}</strong><b>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(order.total))}</b></div>
                      <p>{order.customerName} · {order.customerPhone}</p>
                      <small>{order.customerEmail} · {formatDateTime(order.createdAt)}</small>
                      <p className="account-manager-status">{orderStatusLabels[order.status] || order.status} · Pix {order.paymentStatus === "PAGO" ? "pago" : "pendente"}</p>
                      <div className="account-manager-actions">
                        {order.paymentStatus === "PENDENTE" && order.status !== "CANCELADO" && <button type="button" onClick={() => updateManagedOrder(order.id, { paymentStatus: "PAGO" })} disabled={isUpdating}>{isUpdating ? "Salvando..." : "Confirmar Pix recebido"}</button>}
                        {nextStatus && <button type="button" onClick={() => updateManagedOrder(order.id, { status: nextStatus })} disabled={isUpdating}>{isUpdating ? "Salvando..." : `Avançar: ${orderStatusLabels[nextStatus]}`}</button>}
                        {!['ENTREGUE', 'CANCELADO'].includes(order.status) && <button className="is-cancel" type="button" onClick={() => updateManagedOrder(order.id, { status: "CANCELADO" })} disabled={isUpdating}>Cancelar pedido</button>}
                      </div>
                    </article>;
                    }) : <p>A loja ainda não recebeu pedidos.</p>}
                  </>
                )}
              </div>
              <button className="account-primary-button" type="button" onClick={onSignOut}>Sair da conta</button>
            </div>
          ) : (
            <>
              <div className="account-heading"><span className="section-eyebrow">Bem-vinda(o)</span><h1 id="account-title">{isRegistering ? "Crie sua conta" : "Entre na sua conta"}</h1><p>{isRegistering ? "Informe seus dados para criar sua conta." : "Que bom ter voce de volta."}</p></div>
              <div className="account-tabs" role="group" aria-label="Escolha login ou cadastro">
                <button type="button" className={!isRegistering ? "is-active" : ""} aria-pressed={!isRegistering} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>Entrar</button>
                <button type="button" className={isRegistering ? "is-active" : ""} aria-pressed={isRegistering} onClick={() => { setMode("register"); setError(""); setMessage(""); }}>Criar conta</button>
              </div>
              <form className="account-form" onSubmit={handleSubmit}>
                {isRegistering && <label className="account-field"><span>Nome completo</span><span className="account-input-wrap"><UserRound size={17} /><input name="name" autoComplete="name" placeholder="Ex.: Maria da Silva" value={fields.name} onChange={updateField} required maxLength={150} /></span></label>}
                {isRegistering && <label className="account-field"><span>Telefone / WhatsApp</span><span className="account-input-wrap"><Phone size={17} /><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={fields.phone} onChange={updateField} required maxLength={20} /></span></label>}
                <label className="account-field"><span>E-mail</span><span className="account-input-wrap"><Mail size={17} /><input name="email" type="email" autoComplete="email" placeholder="fulanodetal@gmail.com" value={fields.email} onChange={updateField} required /></span></label>
                <label className="account-field"><span>Senha</span><span className="account-input-wrap"><LockKeyhole size={17} /><input name="password" type={showPassword ? "text" : "password"} autoComplete={isRegistering ? "new-password" : "current-password"} placeholder={isRegistering ? "Pelo menos 8 caracteres" : "Digite sua senha"} minLength={8} value={fields.password} onChange={updateField} required /><button className="account-visibility-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
                {isRegistering && <label className="account-field"><span>Confirme sua senha</span><span className="account-input-wrap"><LockKeyhole size={17} /><input name="passwordConfirmation" type={showPasswordConfirmation ? "text" : "password"} autoComplete="new-password" placeholder="Digite a senha novamente" minLength={8} value={fields.passwordConfirmation} onChange={updateField} required /><button className="account-visibility-toggle" type="button" onClick={() => setShowPasswordConfirmation((visible) => !visible)} aria-label={showPasswordConfirmation ? "Ocultar confirmação da senha" : "Mostrar confirmação da senha"} aria-pressed={showPasswordConfirmation}>{showPasswordConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>}
                {error && <p className="account-error" role="alert">{error}</p>}
                {needsConfirmation && <button className="account-resend-button" type="button" onClick={resendConfirmation} disabled={resendingConfirmation || confirmationRequested || !fields.email.trim()}>{resendingConfirmation ? "Enviando..." : confirmationRequested ? "Reenvio solicitado" : "Reenviar e-mail de confirmação"}</button>}
                {message && <p className="account-auth-message" role="status">{message}</p>}
                <button className="account-primary-button" type="submit" disabled={busy}>{busy ? "Aguarde..." : isRegistering ? "Criar minha conta" : "Entrar"}<ArrowRight size={17} /></button>
              </form>
              <p className="account-demo-note">Sua senha e autenticada e protegida pelo Supabase.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default AccountPanel;
