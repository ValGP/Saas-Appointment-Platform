import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  HeartPulse,
  MessageCircle,
  Scissors,
  Sparkles,
  Star,
  Stethoscope,
  WandSparkles,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PublicFooter } from "../components/PublicFooter";
import {
  commonTreatmentFaqs,
  getTreatmentCategory,
} from "../data/treatmentContent";

const iconBySlug = {
  "recuperacion-capilar": Scissors,
  "estetica-facial": Sparkles,
  "estetica-corporal": WandSparkles,
  "pestanas-cejas": Star,
  podologia: Stethoscope,
};

export function TreatmentCategoryPage() {
  const { businessSlug, slug } = useParams<{ businessSlug: string; slug: string }>();
  const category = getTreatmentCategory(slug);

  if (!category) {
    return <Navigate to={`/n/${businessSlug}`} replace />;
  }

  const Icon = iconBySlug[category.slug as keyof typeof iconBySlug] ?? HeartPulse;

  return (
    <div className="treatment-page">
      <section className="treatment-hero">
        <div className="treatment-hero-copy">
          <Link className="treatment-back-link" to={`/n/${businessSlug}#tratamientos`}>
            <ArrowLeft aria-hidden="true" size={16} />
            Tratamientos
          </Link>
          <h1>{category.title}</h1>
          <p>{category.heroText}</p>
          <a className="public-primary-button" href="#consulta">
            <MessageCircle aria-hidden="true" size={18} />
            {category.ctaLabel}
          </a>
        </div>

        <div
          className={`treatment-visual treatment-visual-${category.slug}`}
        >
          <img alt={category.title} src={category.imageSrc} />
          <span>{category.title}</span>
          <Icon aria-hidden="true" size={24} />
        </div>
      </section>

      <section className="treatment-section treatment-intro-section">
        <div>
          <p className="public-pill">Enfoque</p>
          <h2>Informacion clara para decidir mejor</h2>
        </div>
        <div className="treatment-intro-copy">
          {category.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="treatment-section" id="tratamientos-incluidos">
        <div className="treatment-section-heading">
          <p className="public-pill">Tratamientos incluidos</p>
          <h2>Opciones dentro de {category.title.toLowerCase()}</h2>
          <p>
            Cada ficha resume para que puede servir. El detalle definitivo se
            conversa en consulta, segun evaluacion profesional.
          </p>
        </div>

        <div className="treatment-card-grid">
          {category.treatments.map((treatment) => (
            <article className="treatment-detail-card" key={treatment.title}>
              <h3>{treatment.title}</h3>
              <p>{treatment.description}</p>
              <strong>Indicado para</strong>
              <ul>
                {treatment.indicatedFor.map((item) => (
                  <li key={item}>
                    <CheckCircle aria-hidden="true" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#consulta">
                Consultar
                <ArrowRight aria-hidden="true" size={16} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="treatment-section treatment-benefits-panel">
        <div>
          <p className="public-pill">Que podes esperar</p>
          <h2>Un proceso cuidado y personalizado</h2>
        </div>
        <div className="treatment-benefits-grid">
          {category.benefits.map((benefit) => (
            <article key={benefit}>
              <Sparkles aria-hidden="true" size={20} />
              <span>{benefit}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="treatment-section">
        <div className="treatment-section-heading">
          <p className="public-pill">Preguntas frecuentes</p>
          <h2>Dudas habituales antes de consultar</h2>
        </div>

        <div className="treatment-faq-list">
          {commonTreatmentFaqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="treatment-final-cta" id="consulta">
        <div>
          <p className="public-pill">Consulta personalizada</p>
          <h2>Queres saber si este tratamiento es para vos?</h2>
          <p>
            Agenda una consulta y recibi asesoramiento para elegir el camino
            mas adecuado segun tu caso.
          </p>
        </div>
        <div className="treatment-final-actions">
          <a
            className="public-primary-button"
            href="https://wa.me/"
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle aria-hidden="true" size={18} />
            Contactar por WhatsApp
          </a>
          <Link className="public-ghost-button" to={`/n/${businessSlug}/register`}>
            Reservar turno
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
