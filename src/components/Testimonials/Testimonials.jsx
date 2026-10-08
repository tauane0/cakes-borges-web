import { Star } from "lucide-react";

// Depoimentos fictícios usados como prova social nesta demonstração.
const testimonials = [
  {
    id: 1,
    name: "Mariana Souza",
    text: "O bolo estava lindo e muito saboroso. A decoração ficou exatamente como eu imaginei.",
    rating: 5,
  },
  {
    id: 2,
    name: "Camila Oliveira",
    text: "Tudo muito caprichado, desde o atendimento até a entrega. Com certeza vou pedir novamente.",
    rating: 5,
  },
  {
    id: 3,
    name: "Beatriz Santos",
    text: "O sabor estava incrível e o bolo fez toda a diferença na nossa comemoração.",
    rating: 5,
  },
];

function Testimonials() {
  return (
    <section className="testimonials" id="depoimentos">
      <div className="testimonials-container">

        <div className="section-heading">
          <span className="section-eyebrow">
            Quem já experimentou
          </span>

          <h2>
            O que nossos <span>clientes dizem</span>
          </h2>

          <p>
            Cada pedido é preparado para fazer parte de momentos especiais.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <article
              className="testimonial-card"
              key={testimonial.id}
            >
              <div className="testimonial-stars">
                {Array.from({ length: testimonial.rating }).map(
                  (_, index) => (
                    <Star
                      key={index}
                      size={16}
                      fill="currentColor"
                    />
                  )
                )}
              </div>

              <p className="testimonial-text">
                “{testimonial.text}”
              </p>

              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  {testimonial.name.charAt(0)}
                </div>

                <div>
                  <strong>{testimonial.name}</strong>
                  <span>Cliente Cakes Borges</span>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Testimonials;
