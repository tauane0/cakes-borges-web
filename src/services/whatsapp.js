// =======================
// Monta links seguros para iniciar uma conversa com a loja no WhatsApp
// =======================
const storeWhatsAppNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/\D/g, "");

export function createWhatsAppLink(message) {
  if (storeWhatsAppNumber.length < 10 || storeWhatsAppNumber.length > 15) return "";
  return `https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(message)}`;
}
