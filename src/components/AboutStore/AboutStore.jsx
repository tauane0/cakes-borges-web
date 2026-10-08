import { ArrowRight, Sparkles } from "lucide-react";

// Conteúdo institucional com a história, indicadores e chamada para novidades.
function AboutStore() {
  return (
    <section className="about-store" id="sobre">
      <div className="about-store-container">

        <div className="about-store-image">
          {/* Foto ilustrativa de Monika Grabkowska, via Unsplash (licença Unsplash). */}
          <img
            className="about-store-photo"
            src="https://images.unsplash.com/photo-1633352638067-fdf2c07561c7?auto=format&fit=crop&w=1200&q=85"
            alt="Pessoa segurando um bolo decorado com frutas"
            loading="lazy"
          />

          <div className="about-store-badge">
            <Sparkles size={16} />
            <span>Feito com amor</span>
          </div>
        </div>

        <div className="about-store-content">

          <span className="section-eyebrow">
            Nossa história
          </span>

          <h2>
            Mais que bolos,
            <span> momentos especiais</span>
          </h2>

          <p>
            Na Cakes Borges, acreditamos que cada comemoração
            merece um doce especial. Por isso, preparamos cada
            pedido com cuidado, carinho e atenção aos detalhes.
          </p>

          <p>
            Nossa proposta é unir sabor, qualidade e personalização
            para transformar cada bolo em parte de uma lembrança
            inesquecível.
          </p>

          <div className="about-store-stats">

            <div className="about-stat">
              <strong>10+</strong>
              <span>Anos de experiência</span>
            </div>

            <div className="about-stat">
              <strong>5 mil+</strong>
              <span>Clientes atendidos</span>
            </div>

            <div className="about-stat">
              <strong>100%</strong>
              <span>Produção artesanal</span>
            </div>

          </div>

          <a href="#contato" className="about-store-button">
            Receba nossas novidades
            <ArrowRight size={17} />
          </a>

        </div>

      </div>
    </section>
  );
}

export default AboutStore;
