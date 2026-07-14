import {
  ArrowRight,
  HeartPulse,
  MessageCircle,
  Sparkles,
  Star,
  Stethoscope,
  WandSparkles,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PublicFooter } from "../components/PublicFooter";
import { useActiveBusiness } from "../../../app/providers/BusinessProvider";
import { useQuery } from "@tanstack/react-query";
import { getPublicServices } from "../../services/api/servicesApi";
import { getPublicProfessionals } from "../../professionals/api/professionalsApi";

export function HomePage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { business } = useActiveBusiness();

  const servicesQuery = useQuery({
    queryKey: ["public-services-list", businessSlug],
    enabled: !!businessSlug,
    queryFn: () => getPublicServices(),
  });

  const professionalsQuery = useQuery({
    queryKey: ["public-professionals-list", businessSlug],
    enabled: !!businessSlug,
    queryFn: () => getPublicProfessionals(),
  });

  const services = servicesQuery.data ?? [];
  const professionals = professionalsQuery.data ?? [];
  const waNumber = business?.whatsapp ? business.whatsapp.replace(/\s+/g, "") : "";

  return (
    <div className="public-landing">
      <section className="public-hero" id="inicio" style={{ background: "linear-gradient(135deg, var(--primary) 0%, transparent 100%)", minHeight: "55vh", display: "flex", alignItems: "center" }}>
        <div className="public-hero-content" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
          <div className="public-hero-kicker">
            <strong>Reservas Online</strong>
          </div>
          <h1>{business?.name ?? "Turnos Online"}</h1>
          <p>
            Elegí tu servicio, profesional y horario preferido desde nuestro asistente de reservas en línea.
          </p>
          <div className="public-hero-actions">
            <Link className="public-primary-button" to={`/n/${businessSlug}/book`}>
              <MessageCircle aria-hidden="true" size={18} />
              Reservar turno
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            {waNumber && (
              <a className="public-ghost-button" href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
                Contactar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="public-section public-treatment-section" id="servicios" style={{ padding: "60px 20px" }}>
        <SectionHeading
          eyebrow="Servicios"
          text="Nuestro catálogo completo de servicios disponibles para agendar online."
          title="Nuestros Servicios"
        />

        {servicesQuery.isLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Cargando catálogo de servicios...</div>
        ) : services.length === 0 ? (
          <div className="client-empty-state" style={{ textAlign: "center", padding: "40px" }}>
            <strong>No hay servicios registrados en este momento.</strong>
          </div>
        ) : (
          <div className="public-treatment-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginTop: "30px" }}>
            {services.map((service) => (
              <article className="public-treatment-card" key={service.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px", border: "1px solid var(--line, #ccc)", borderRadius: "12px", background: "var(--surface, #fff)" }}>
                <div>
                  <Sparkles aria-hidden="true" size={24} style={{ color: "var(--primary)" }} />
                  <h3 style={{ margin: "12px 0 8px 0", fontSize: "18px" }}>{service.name}</h3>
                  <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 16px 0", minHeight: "40px" }}>{service.description || "Sin descripción."}</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", borderTop: "1px solid var(--line, #ccc)", paddingTop: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{service.durationMinutes} min</span>
                    <strong style={{ fontSize: "16px", color: "var(--primary)" }}>${service.price}</strong>
                  </div>
                  <Link className="public-primary-button" to={`/n/${businessSlug}/book`} style={{ padding: "6px 12px", fontSize: "14px" }}>
                    Agendar
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {professionals.length > 0 && (
        <section className="public-section" id="equipo" style={{ padding: "60px 20px", background: "var(--surface-soft, #fdfbfa)" }}>
          <SectionHeading
            eyebrow="Profesionales"
            text="Conocé a los especialistas preparados para atenderte."
            title="Nuestro Equipo"
          />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "30px", marginTop: "40px" }}>
            {professionals.map((prof) => (
              <div key={prof.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", background: "var(--surface, #fff)", border: "1px solid var(--line, #ccc)", borderRadius: "12px", minWidth: "200px" }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "var(--primary-strong)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "20px",
                  marginBottom: "12px"
                }}>
                  {prof.fullName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                </div>
                <strong>{prof.fullName}</strong>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>Profesional</span>
                <Link to={`/n/${businessSlug}/book`} style={{ marginTop: "12px", fontSize: "13px", color: "var(--primary)", fontWeight: 500 }}>
                  Reservar con {prof.fullName.split(" ")[0]} ➔
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="public-section" id="contacto" style={{ padding: "60px 20px", textAlign: "center" }}>
        <h2>Contacto y Consultas</h2>
        <p style={{ maxWidth: "600px", margin: "10px auto 30px auto", color: "var(--muted)" }}>
          ¿Tenés alguna duda o querés realizar una consulta especial? Contactate directamente con nosotros.
        </p>
        <div className="public-final-actions" style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          {waNumber && (
            <a className="public-primary-button" href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
              <MessageCircle aria-hidden="true" size={18} />
              Contactar por WhatsApp
            </a>
          )}
          <Link className="public-ghost-button" to={`/n/${businessSlug}/login`}>
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
