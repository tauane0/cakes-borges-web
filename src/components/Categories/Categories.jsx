import "./Categories.css";

const categories = [
  {
    name: "Bolos",
    description: "Bolos para diferentes momentos e ocasiões.",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
    link: "#mais-vendidos",
  },
  {
    name: "Complementos",
    description: "Docinhos e outras opções para acompanhar.",
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",
    link: "#complementos",
  },
  {
    name: "Kits",
    description: "Combinações prontas para deixar a comemoração completa.",
    image:
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80",
    link: "#kits",
  },
];

// Cards de navegação para as seções de bolos, complementos e kits.
function Categories() {
  return (
    <section className="categories" id="categorias">
      <div className="categories-container">
        <div className="section-heading">
          <span className="section-eyebrow">Para escolher sem pressa</span>
          <h2>O que você está procurando?</h2>
          <p>Escolha uma categoria e encontre algo que combine com a sua ocasião.</p>
        </div>

        <div className="categories-grid">
          {categories.map((category) => (
            <a href={category.link} className="category-card" key={category.name}>
              <div className="category-image">
                <img src={category.image} alt={category.name} />
              </div>
              <div className="category-content">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span className="category-link">Ver opções →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;
