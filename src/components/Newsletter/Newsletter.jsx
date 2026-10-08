import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";

// Cadastro demonstrativo de novidades; o e-mail não é enviado nem armazenado.
function Newsletter() {
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubscribed(true);
  }

  return (
    <section className="newsletter" id="contato">
      <div className="newsletter-container">
        <div className="newsletter-icon">
          <Mail size={28} strokeWidth={1.7} />
        </div>

        <div className="newsletter-content">
          <span className="section-eyebrow">
            Uma dose de doçura
          </span>

          <h2>
            Receba novidades da <span>Cakes Borges</span>
          </h2>

          <p>
            Cadastre seu e-mail para receber novidades, sabores especiais
            e condições exclusivas.
          </p>
        </div>

        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            aria-label="Seu melhor e-mail"
            required
          />

          <button type="submit">
            {subscribed ? "Cadastro demonstrativo" : "Quero receber"}
            <ArrowRight size={17} />
          </button>
        </form>
        {subscribed && <p className="newsletter-success" role="status">Obrigado! Esta demonstração não envia nem armazena o e-mail.</p>}
      </div>
    </section>
  );
}

export default Newsletter;
