import WhatsAppIcon from "../WhatsAppIcon/WhatsAppIcon";
import { createWhatsAppLink } from "../../services/whatsapp";
import "./WhatsAppButton.css";

// =======================
// Atalho flutuante para contato com a loja pelo WhatsApp
// =======================
function WhatsAppButton() {
  const href = createWhatsAppLink("Olá! Vim pelo site Cakes Borges e gostaria de tirar uma dúvida.");

  // Sem um telefone válido configurado, não mostramos um botão que não poderia funcionar.
  if (!href) return null;

  return (
    <a className="whatsapp-float" href={href} target="_blank" rel="noreferrer" aria-label="Fale com a Cakes Borges pelo WhatsApp">
      <WhatsAppIcon size={25} />
      <span>Fale conosco</span>
    </a>
  );
}

export default WhatsAppButton;
