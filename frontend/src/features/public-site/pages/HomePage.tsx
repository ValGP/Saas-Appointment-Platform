import {
  ArrowRight,
  HeartPulse,
  LayoutGrid,
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

  // Agrupar los servicios por el nombre de su categoría
  const servicesByCategory = services.reduce<Record<string, typeof services>>((acc, service) => {
    const categoryName = service.categoryName || "Otros Servicios";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(service);
    return acc;
  }, {});

  return (
    <div className="public-landing" style={{ background: "var(--bg)" }}>
      <section className="public-hero-new" id="inicio">
        <div className="hero-blob"></div>
        <div className="hero-left">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Turnos Disponibles Hoy</span>
          </div>
          <h1>
            Agendá tu turno online en <span className="text-highlight">{business?.name ?? "nuestro negocio"}</span>
          </h1>
          <p>
            Elegí tus servicios y profesionales preferidos de forma rápida y sencilla desde nuestro asistente de reservas en línea.
          </p>
          <div className="hero-actions">
            <Link className="public-primary-button" to={`/n/${businessSlug}/book`}>
              Reservar ahora
              <ArrowRight size={18} style={{ marginLeft: "6px" }} />
            </Link>
          </div>

          {/* Stepper Vectorial Dinámico (Fase 4.1.3 update) */}
          <div className="hero-stepper" style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "48px",
            justifyContent: "center",
            width: "100%",
            maxWidth: "480px"
          }}>
            {/* Paso 1: Calendario y Horas */}
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "var(--primary-light)",
              border: "1px solid var(--primary-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              boxShadow: "0 8px 20px var(--shadow-color)",
              flexShrink: 0
            }}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <circle cx="16" cy="16" r="4" fill="var(--surface)" />
                <polyline points="16 14 16 16 17.5 17.5" />
              </svg>
            </div>

            {/* Línea 1 */}
            <div style={{
              flex: "1",
              height: "2px",
              background: "var(--primary-border)",
              minWidth: "30px"
            }}></div>

            {/* Paso 2: Profesional / Staff */}
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "var(--primary-light)",
              border: "1px solid var(--primary-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              boxShadow: "0 8px 20px var(--shadow-color)",
              flexShrink: 0
            }}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            {/* Línea 2 */}
            <div style={{
              flex: "1",
              height: "2px",
              background: "var(--primary-border)",
              minWidth: "30px"
            }}></div>

            {/* Paso 3: Éxito / Confirmación */}
            <div style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "var(--primary-light)",
              border: "1px solid var(--primary-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              boxShadow: "0 8px 20px var(--shadow-color)",
              flexShrink: 0
            }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
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
          <div className="public-categories-container" style={{ display: "flex", flexDirection: "column", gap: "40px", marginTop: "30px" }}>
            {Object.entries(servicesByCategory).map(([categoryName, items]) => (
              <div key={categoryName} className="public-category-group">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    color: "var(--text)",
                    margin: 0,
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}>
                    {categoryName}
                  </h3>
                  <div style={{ flex: 1, height: "1px", background: "var(--line)" }}></div>
                </div>

                <div className="public-treatment-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                  {items.map((service) => (
                    <article className="public-treatment-card" key={service.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px", border: "1px solid var(--line)", borderRadius: "16px", background: "var(--surface)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
                      {/* Contenedor horizontal superior (icono a la izquierda, título y descripción a la derecha) */}
                      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        {/* Icono de grilla en caja gris claro elegante */}
                        <div style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: "var(--surface-soft)",
                          border: "1px solid var(--line)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--primary)",
                          flexShrink: 0
                        }}>
                          <LayoutGrid size={20} />
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "700", color: "var(--text)", lineHeight: "1.3" }}>
                            {service.name}
                          </h4>
                          {service.description && (
                            <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0, lineHeight: "1.5" }}>
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>{service.durationMinutes} min</span>
                          <strong style={{ fontSize: "18px", color: "var(--primary)", fontWeight: "800" }}>${service.price}</strong>
                        </div>
                        <Link className="public-primary-button" to={`/n/${businessSlug}/book`} style={{ padding: "6px 16px", fontSize: "14px", minHeight: "38px" }}>
                          Agendar
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
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
