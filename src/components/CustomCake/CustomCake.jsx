import { useState } from "react";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, CakeSlice, Check, CheckCircle2, ShoppingCart } from "lucide-react";
import { fetchCustomCakeOptions } from "../../services/customCake";
import "./CustomCake.css";

// Precos base e pesos carregados do banco; os adicionais sao revalidados pela API.

const masses = ["Baunilha", "Chocolate", "Red velvet"];
const fillings = ["Brigadeiro", "Ninho", "Doce de leite", "Prestígio", "Beijinho", "Chocolate", "Morango"];
const coverages = ["Ganache", "Chantilly", "Buttercream"];
const decorations = [
  { label: "Acabamento clássico", price: 0 },
  { label: "Decoração especial", price: 15 },
];
const extras = ["Morangos frescos", "Velas decorativas", "Brigadeiros extras"];
const extraPrice = 5;
const secondFillingPrice = 10;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function createEmptySelection() {
  return {
    weight: "",
    mass: "",
    fillings: [],
    coverage: "",
    decoration: "",
    extras: [],
    notes: "",
  };
}

const steps = [
  { title: "Escolha o peso", description: "Selecione um dos tamanhos disponíveis para o bolo." },
  { title: "Escolha a massa", description: "A massa é obrigatória. Escolha uma opção." },
  { title: "Monte os recheios", description: "Um recheio está incluso. Você pode adicionar um segundo por R$ 10,00." },
  { title: "Escolha a cobertura", description: "Selecione uma cobertura para finalizar o bolo." },
  { title: "Escolha a decoração", description: "A decoração especial acrescenta R$ 15,00 à estimativa." },
  { title: "Adicione extras", description: "Esta etapa é opcional. Cada extra acrescenta R$ 5,00 à estimativa." },
  { title: "Deixe uma observação", description: "Conte algum detalhe importante. A observação não altera o preço automaticamente." },
];

// Questionário em etapas que monta uma configuração de bolo e envia ao carrinho.
function CustomCake({ onAddToCart = () => {} }) {
  // Uma única tela ativa evita estados conflitantes entre apresentação, questionário e sucesso.
  const [view, setView] = useState("intro");
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState(createEmptySelection);
  const [weights, setWeights] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const screenRef = useRef(null);
  const previousView = useRef("intro");

  useEffect(() => {
    fetchCustomCakeOptions().then((options) => setWeights(options.map((option) => ({
      ...option, value: String(option.weightKg), label: `${String(option.weightKg).replace('.', ',')} kg`, price: option.amount,
    })))).catch((error) => setCatalogError(error.message));
  }, []);

  // O questionário encolhe ao concluir; reposiciona a tela para a confirmação não ficar fora do viewport.
  useEffect(() => {
    const returningToIntro = previousView.current === "success" && view === "intro";
    if (view === "success" || returningToIntro) {
      requestAnimationFrame(() => {
        screenRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    previousView.current = view;
  }, [view]);

  const selectedWeight = weights.find((item) => item.value === selection.weight);
  const selectedDecoration = decorations.find((item) => item.label === selection.decoration);
  const totalEstimate = selectedWeight
    ? selectedWeight.price
      + (selection.fillings.length > 1 ? secondFillingPrice : 0)
      + (selectedDecoration?.price ?? 0)
      + selection.extras.length * extraPrice
    : null;

  function updateSelection(key, value) {
    setSelection((current) => ({ ...current, [key]: value }));
  }

  function toggleOption(key, value) {
    setSelection((current) => {
      const selected = current[key];
      if (selected.includes(value)) {
        return { ...current, [key]: selected.filter((item) => item !== value) };
      }
      if (key === "fillings" && selected.length >= 2) return current;
      return { ...current, [key]: [...selected, value] };
    });
  }

  // Depois da confirmação, o botão Voltar reinicia o questionário para outra montagem.
  function returnToIntro() {
    setStep(0);
    setSelection(createEmptySelection());
    setView("intro");
  }

  const canContinue = [
    Boolean(selection.weight),
    Boolean(selection.mass),
    selection.fillings.length >= 1 && selection.fillings.length <= 2,
    Boolean(selection.coverage),
    Boolean(selection.decoration),
    true,
    true,
  ][step];

  async function finishOrder() {
    if (!selectedWeight) return;
    setSubmitting(true);
    try {
    const added = await onAddToCart({
      id: selectedWeight.productId,
      priceOptionId: selectedWeight.priceOptionId,
      price: totalEstimate,
      image: selectedWeight.image,
      name: "Bolo personalizado",
      configuration: {
        ...selection,
        fillings: [...selection.fillings],
        extras: [...selection.extras],
      },
    });
    if (!added) throw new Error("Falha ao adicionar o bolo.");
    setView("success");
    } catch { setCatalogError("Nao foi possivel adicionar o bolo ao carrinho. Tente novamente."); }
    finally { setSubmitting(false); }
  }

  function renderChoice(option, key, type = "radio", detail = "") {
    const value = typeof option === "string" ? option : (option.value ?? option.label);
    const label = typeof option === "string" ? option : option.label;
    const isChecked = type === "checkbox"
      ? selection[key].includes(value)
      : selection[key] === value;
    const isDisabled = key === "fillings" && type === "checkbox" && !isChecked && selection.fillings.length >= 2;

    return (
      <label className={`cake-choice${isChecked ? " is-selected" : ""}${isDisabled ? " is-disabled" : ""}`} key={value}>
        <input
          type={type}
          name={key}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={() => type === "checkbox" ? toggleOption(key, value) : updateSelection(key, value)}
        />
        <span className="cake-choice-check"><Check size={14} /></span>
        <span className="cake-choice-copy">
          <strong>{label}</strong>
          {detail && <small>{detail}</small>}
        </span>
      </label>
    );
  }

  return (
    <section className="custom-cake" id="monte-seu-bolo">
      <div className="cake-builder-container">
        {view === "success" ? (
          <div className="cake-success-screen" ref={screenRef} role="status" aria-live="polite">
            <span className="cake-success-icon"><CheckCircle2 size={42} strokeWidth={1.7} /></span>
            <h2>Bolo personalizado feito e adicionado ao carrinho!</h2>
            <button className="cake-next-button cake-success-back" type="button" onClick={returnToIntro}>
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
        ) : view === "intro" ? (
          <div className="cake-builder-intro" ref={screenRef}>
            <div className="cake-builder-intro-visual" aria-hidden="true">
              {/* Foto ilustrativa de Annie Spratt, via Unsplash (licença Unsplash). */}
              <img
                className="cake-builder-intro-photo"
                src="https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1000&q=85"
                alt=""
                loading="lazy"
              />
              <span>feito para a sua comemoração</span>
            </div>
            <div className="cake-builder-intro-content">
              <span className="section-eyebrow">Do seu jeito</span>
              <h2>Monte o bolo <span>perfeito para você</span></h2>
              <p>Escolha peso, massa, recheios, cobertura e decoração. Acompanhe suas escolhas e veja uma estimativa enquanto monta.</p>
              <ul>
                <li><Check size={16} /> Escolha entre os pesos disponíveis</li>
                <li><Check size={16} /> Combine até dois recheios</li>
                <li><Check size={16} /> Personalize com decoração e extras</li>
              </ul>
              <button className="cake-next-button cake-start-button" type="button" onClick={() => setView("wizard")}>
                Começar a montar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <button className="cake-return-button" type="button" onClick={() => setView("intro")}>
              <ArrowLeft size={15} /> Voltar à apresentação
            </button>
            <div className="cake-builder-heading">
          <span className="section-eyebrow">Do seu jeito</span>
          <h2>Monte o bolo <span>perfeito para você</span></h2>
          <p>Responda às etapas e crie uma combinação do seu jeito.</p>
        </div>

        <div className="cake-builder-layout">
          <div className="cake-builder-main">
            <div className="cake-builder-progress" role="progressbar" aria-label="Progresso da montagem" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1}>
              <div className="cake-progress-track"><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
              <span>Etapa {step + 1} de {steps.length}</span>
            </div>

            <div className="cake-question" aria-live="polite">
              {/* O icone identifica visualmente o questionario aberto pelo botao de montagem. */}
              <span className="cake-question-icon"><CakeSlice size={22} /></span>
              <h3>{steps[step].title}</h3>
              <p>{steps[step].description}</p>
            </div>

            {step === 0 && (
              <div className="cake-choice-grid cake-weight-grid">
                {catalogError && <p role="alert">{catalogError}</p>}
                {weights.map((weight) => renderChoice(
                  { value: weight.value, label: weight.label },
                  "weight",
                  "radio",
                  money.format(weight.price),
                ))}
                {!weights.length && !catalogError && <p>Carregando pesos e precos...</p>}
              </div>
            )}
            {step === 1 && <div className="cake-choice-grid">{masses.map((mass) => renderChoice(mass, "mass"))}</div>}
            {step === 2 && <div className="cake-choice-grid">{fillings.map((filling) => renderChoice(filling, "fillings", "checkbox"))}</div>}
            {step === 3 && <div className="cake-choice-grid">{coverages.map((coverage) => renderChoice(coverage, "coverage"))}</div>}
            {step === 4 && <div className="cake-choice-grid">{decorations.map((decoration) => renderChoice(decoration, "decoration", "radio", decoration.price ? `+ ${money.format(decoration.price)}` : "Inclusa"))}</div>}
            {step === 5 && <div className="cake-choice-grid">{extras.map((extra) => renderChoice(extra, "extras", "checkbox", `+ ${money.format(extraPrice)}`))}</div>}
            {step === 6 && (
              <div className="cake-notes-field">
                <label htmlFor="cake-notes">Observações <span>(opcional)</span></label>
                <textarea id="cake-notes" rows="4" maxLength="300" placeholder="Ex.: gostaria de uma decoração parecida com uma referência que vou enviar." value={selection.notes} onChange={(event) => updateSelection("notes", event.target.value)} />
                <small>{selection.notes.length}/300 caracteres. Observações não alteram a estimativa.</small>
              </div>
            )}

            <div className="cake-step-actions">
              <button className="cake-back-button" type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
                <ArrowLeft size={16} /> Voltar
              </button>
              {step < steps.length - 1 ? (
                <button className="cake-next-button" type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} disabled={!canContinue}>
                  Continuar <ArrowRight size={16} />
                </button>
              ) : (
                <button className="cake-next-button" type="button" onClick={finishOrder} disabled={!canContinue || totalEstimate === null || submitting}>
                  {submitting ? "Adicionando..." : "Adicionar ao carrinho"} <ShoppingCart size={16} />
                </button>
              )}
            </div>
          </div>

          <aside className="cake-builder-summary" aria-label="Resumo do bolo personalizado">
            <h3>Resumo da montagem</h3>
            <dl>
              <div><dt>Peso</dt><dd>{selectedWeight?.label ?? "A escolher"}</dd></div>
              <div><dt>Massa</dt><dd>{selection.mass || "A escolher"}</dd></div>
              <div><dt>Recheios</dt><dd>{selection.fillings.length ? selection.fillings.join(" + ") : "A escolher"}</dd></div>
              <div><dt>Cobertura</dt><dd>{selection.coverage || "A escolher"}</dd></div>
              <div><dt>Decoração</dt><dd>{selection.decoration || "A escolher"}</dd></div>
              <div><dt>Extras</dt><dd>{selection.extras.length ? selection.extras.join(", ") : "Nenhum"}</dd></div>
            </dl>
            <div className="cake-estimate">
              <span>Estimativa</span>
              <strong>{totalEstimate === null ? "Escolha o peso" : money.format(totalEstimate)}</strong>
            </div>
            <p className="cake-estimate-note">Estimativa demonstrativa. O backend recalcula o valor final na finalização do pedido.</p>
          </aside>
        </div>
          </>
        )}
      </div>
    </section>
  );
}

export default CustomCake;
