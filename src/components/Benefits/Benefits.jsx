import {
  Leaf,
  CakeSlice,
  Truck,
  ShieldCheck,
} from "lucide-react";

import "./Benefits.css";

// Benefícios fictícios exibidos para destacar os diferenciais da loja.
const benefits = [
  {
    icon: Leaf,
    title: "Ingredientes Frescos",
    description: "Selecionados com cuidado",
  },
  {
    icon: CakeSlice,
    title: "Encomendas Personalizadas",
    description: "Do seu jeito",
  },
  {
    icon: Truck,
    title: "Entrega Rápida",
    description: "Receba com segurança",
  },
  {
    icon: ShieldCheck,
    title: "Pagamento Seguro",
    description: "Compra protegida",
  },
];

function Benefits() {
  return (
    <section className="benefits">
      <div className="benefits-container">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <div className="benefit-item" key={benefit.title}>
              <div className="benefit-icon">
                <Icon size={23} strokeWidth={1.8} />
              </div>

              <div className="benefit-content">
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Benefits;
