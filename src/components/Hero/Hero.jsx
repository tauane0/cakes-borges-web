import { ArrowUpRight, Heart } from "lucide-react";

import "./Hero.css";

// Apresentação principal da confeitaria e atalhos para os catálogos e o bolo personalizado.
function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-container">

        <div className="hero-content">

          <div className="hero-label">
            <span className="hero-label-dot"></span>
            Confeitaria artesanal
          </div>

          <h1 className="hero-title">
            Um doce feito para
            <em> marcar o momento.</em>
          </h1>

          <p className="hero-description">
            Bolos artesanais preparados em pequenos detalhes,
            com sabor, cuidado e aquele toque que transforma
            uma ocasião comum em uma lembrança especial.
          </p>

          <div className="hero-buttons">
            <a href="#mais-vendidos" className="hero-button primary">
              Conhecer os bolos
              <ArrowUpRight size={17} />
            </a>

            <a href="#monte-seu-bolo" className="hero-button secondary">
              Criar meu bolo
            </a>
          </div>

          <div className="hero-note">
            <Heart size={14} fill="currentColor" />
            <span>Produção artesanal • Feito com cuidado</span>
          </div>

        </div>

        <div className="hero-visual">

          <div className="hero-image-frame">
            <img
              src="https://cdn.awsli.com.br/2500x2500/2658/2658919/produto/257217253/fatia-de-bolo-vegano-de-brigadeiro-com-morangos-a3liq2p83s.png"
              alt="Fatia de bolo de brigadeiro com morangos"
            />
          </div>

          <div className="hero-product-label">
            <span>01</span>
            <div>
              <strong>Brigadeiro com morangos</strong>
              <small>Uma fatia para começar.</small>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default Hero;
