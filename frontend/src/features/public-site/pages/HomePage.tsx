import {
  ArrowRight,
  CheckCircle,
  HeartPulse,
  MessageCircle,
  Quote,
  Scissors,
  Sparkles,
  Star,
  Stethoscope,
  UserRoundCheck,
  WandSparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PublicFooter } from "../components/PublicFooter";
import { treatmentCategories } from "../data/treatmentContent";

const categoryIcons = {
  "recuperacion-capilar": HeartPulse,
  "estetica-facial": Sparkles,
  "estetica-corporal": WandSparkles,
  "pestanas-cejas": Star,
  podologia: Stethoscope,
};

const benefits = [
  {
    description: "Escuchamos que buscas y orientamos el tratamiento.",
    icon: UserRoundCheck,
    title: "Atencion personalizada",
  },
  {
    description: "Cada proceso se adapta a tus necesidades reales.",
    icon: Sparkles,
    title: "Tratamientos a medida",
  },
  {
    description: "Equipo preparado para trabajar con criterio y cuidado.",
    icon: CheckCircle,
    title: "Profesionales capacitados",
  },
  {
    description: "Acompanamiento claro antes, durante y despues.",
    icon: HeartPulse,
    title: "Seguimiento en cada etapa",
  },
];

const testimonials = [
  {
    initials: "MC",
    name: "Milagros C.",
    text: "Me explicaron cada paso y senti que el tratamiento estaba pensado para mi.",
  },
  {
    initials: "AG",
    name: "Ana G.",
    text: "El espacio es tranquilo, la atencion es muy clara y sali con ganas de volver.",
  },
  {
    initials: "LR",
    name: "Laura R.",
    text: "Me ayudaron a elegir el tratamiento sin prometer cosas raras. Muy profesional.",
  },
];

export function HomePage() {
  return (
    <div className="public-landing">
      <section className="public-hero" id="inicio">
        <div className="public-hero-media" aria-hidden="true" />
        <div className="public-hero-overlay" />
        <div className="public-hero-content">
          <div className="public-hero-kicker">
            <span />
            <WandSparkles aria-hidden="true" size={18} />
            <strong>Salud, estetica y bienestar</strong>
            <span />
          </div>

          <h1>
            Centro de estetica
            <span>y bienestar</span>
          </h1>
          <p>
            Tratamientos faciales, corporales y capilares personalizados para
            acompanarte en cada etapa.
          </p>

          <div className="public-hero-actions">
            <a className="public-primary-button" href="#contacto">
              <MessageCircle aria-hidden="true" size={18} />
              Reservar turno
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <a className="public-ghost-button" href="#tratamientos">
              Ver tratamientos
              <Sparkles aria-hidden="true" size={18} />
            </a>
          </div>
        </div>
      </section>

      <section className="public-section public-treatment-section" id="tratamientos">
        <SectionHeading
          eyebrow="Tratamientos"
          text="Organizamos las opciones principales para que puedas orientarte rapido y consultar lo que necesitas."
          title="Elegi por categoria, no por una lista interminable"
        />

        <div className="public-treatment-grid">
          {treatmentCategories.map((category) => {
            const Icon =
              categoryIcons[category.slug as keyof typeof categoryIcons] ??
              Sparkles;

            return (
              <article className="public-treatment-card" key={category.slug}>
                <div>
                  <Icon aria-hidden="true" size={24} />
                </div>
                <h3>{category.title}</h3>
                <p>{category.shortDescription}</p>
                <Link to={`/tratamientos/${category.slug}`}>
                  Ver mas
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="public-feature-section">
        <div className="public-feature-copy">
          <p className="public-pill">Destacado</p>
          <h2>Notas caida o debilitamiento del cabello?</h2>
          <p>
            Conoce nuestras opciones de recuperacion capilar, PRP y tratamientos
            personalizados para acompanar tu proceso con seguimiento profesional.
          </p>
          <Link
            className="public-primary-button"
            to="/tratamientos/recuperacion-capilar"
          >
            Consultar tratamiento
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
        <div className="public-feature-card">
          <Scissors aria-hidden="true" size={28} />
          <strong>Recuperacion capilar</strong>
          <span>Evaluacion, tratamiento y seguimiento.</span>
        </div>
      </section>

      <section className="public-section public-benefits-section">
        <SectionHeading
          eyebrow="Por que elegir BIBE"
          text="Menos vueltas, mas acompanamiento. La home guia al contacto; el detalle lo vemos juntos en la consulta."
          title="Una experiencia clara, cuidada y personalizada"
        />

        <div className="public-benefits-grid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article className="public-benefit-card" key={benefit.title}>
                <Icon aria-hidden="true" size={22} />
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="public-section public-results-section" id="resultados">
        <SectionHeading
          eyebrow="Resultados"
          text="Hasta sumar imagenes reales, usamos resenas breves para reforzar confianza sin promesas exageradas."
          title="Resultados que acompanan tu proceso"
        />

        <div className="public-testimonials-grid">
          {testimonials.map((testimonial) => (
            <article className="public-testimonial-card" key={testimonial.name}>
              <div className="public-quote-icon">
                <Quote aria-hidden="true" size={22} />
              </div>
              <p>"{testimonial.text}"</p>
              <div className="public-testimonial-author">
                <span>{testimonial.initials}</span>
                <div>
                  <strong>{testimonial.name}</strong>
                  <small>Cliente BIBE</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-about-section" id="sobre">
        <div className="public-about-media">
          <img
            alt="Interior de centro de estetica"
            src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080"
          />
        </div>

        <div className="public-about-copy">
          <p className="public-pill">Sobre BIBE</p>
          <h2>Estetica, salud y bienestar en un mismo lugar.</h2>
          <p>
            En BIBE combinamos estetica, salud y bienestar para acompanarte con
            tratamientos seguros, personalizados y pensados para cada persona.
          </p>
          <a className="public-outline-button" href="#contacto">
            Conocer mas
            <ArrowRight aria-hidden="true" size={18} />
          </a>
        </div>
      </section>

      <section className="public-final-cta" id="contacto">
        <div>
          <p className="public-pill">Contacto</p>
          <h2>Queres saber que tratamiento es ideal para vos?</h2>
          <p>
            Agenda una consulta y recibi asesoramiento personalizado para elegir
            el mejor camino.
          </p>
        </div>
        <div className="public-final-actions">
          <a
            className="public-primary-button"
            href="https://wa.me/"
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle aria-hidden="true" size={18} />
            Contactar por WhatsApp
          </a>
          <Link className="public-ghost-button" to="/login">
            Ingresar al portal
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  text,
  title,
}: {
  eyebrow: string;
  text: string;
  title: string;
}) {
  return (
    <div className="public-section-heading">
      <p className="public-pill">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
