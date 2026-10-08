import "./Bolos.css";

const products = [
  {
    id: 1,
    name: "Bolo de Chocolate",
    description: "Massa de chocolate com recheio cremoso.",
    price: "R$ 89,90",
    rating: "4.9",
    reviews: 124,
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 2,
    name: "Bolo de Morango",
    description: "Massa branca com recheio de morango.",
    price: "R$ 94,90",
    rating: "4.8",
    reviews: 98,
    image:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 3,
    name: "Red Velvet",
    description: "Massa aveludada com creme de baunilha.",
    price: "R$ 109,90",
    rating: "5.0",
    reviews: 86,
    image:
      "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 4,
    name: "Bolo de Baunilha",
    description: "Massa leve com recheio delicado de baunilha.",
    price: "R$ 79,90",
    rating: "4.8",
    reviews: 73,
    image:
      "https://images.unsplash.com/photo-1558303053-6d6c9c8d5f9c?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 5,
    name: "Bolo de Frutas",
    description: "Massa leve com frutas frescas e creme.",
    price: "R$ 99,90",
    rating: "4.9",
    reviews: 65,
    image:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 6,
    name: "Bolo de Brigadeiro",
    description: "Chocolate, brigadeiro e muita cremosidade.",
    price: "R$ 99,90",
    rating: "4.9",
    reviews: 81,
    image:
      "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=700&q=80",
  },
];

// Catálogo independente de bolos com filtros locais e apresentação própria dos produtos.
function Bolos() {
  return (
    <section className="bolos-page" id="bolos">
      <section className="bolos-hero">
        <div className="bolos-container">
          <span className="bolos-eyebrow">NOSSOS BOLOS</span>

          <h1>
            Um bolo para cada
            <span> momento.</span>
          </h1>

          <p>
            Escolha seu sabor favorito e encontre o bolo perfeito
            para deixar sua ocasiÃ£o ainda mais especial.
          </p>
        </div>
      </section>

      <section className="bolos-catalog">
        <div className="bolos-container">
          <div className="bolos-header">
            <div>
              <span className="section-eyebrow">
                Feitos com carinho
              </span>

              <h2>Escolha o seu favorito</h2>
            </div>

            <div className="bolos-filter">
              <button className="filter-button active">
                Todos
              </button>

              <button className="filter-button">
                Chocolate
              </button>

              <button className="filter-button">
                Frutas
              </button>

              <button className="filter-button">
                Especiais
              </button>
            </div>
          </div>

          <div className="bolos-grid">
            {products.map((product) => (
              <article className="bolo-product-card" key={product.id}>
                <button
                  className="bolo-favorite"
                  aria-label={`Adicionar ${product.name} aos favoritos`}
                >
                  â™¡
                </button>

                <div className="bolo-product-image">
                  <img
                    src={product.image}
                    alt={product.name}
                  />
                </div>

                <div className="bolo-product-content">
                  <h3>{product.name}</h3>

                  <p className="bolo-description">
                    {product.description}
                  </p>

                  <div className="bolo-rating">
                    <span>â˜…</span>
                    <strong>{product.rating}</strong>
                    <small>({product.reviews})</small>
                  </div>

                  <div className="bolo-product-bottom">
                    <strong className="bolo-price">
                      {product.price}
                    </strong>

                    <button className="bolo-cart-button">
                      Adicionar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

export default Bolos;
