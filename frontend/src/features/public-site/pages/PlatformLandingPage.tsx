import { useEffect, useState } from "react";
import { apiRequest } from "../../../shared/api/httpClient";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Calendar, Star, ShieldCheck } from "lucide-react";

type Business = {
  id: number;
  name: string;
  slug: string;
  primaryColor: string;
  themePreset: string;
  bookingEnabled: boolean;
  showBranding: boolean;
  whatsapp?: string;
};

export function PlatformLandingPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    apiRequest<Business[]>("/api/public/businesses")
      .then((data) => {
        setBusinesses(data);
      })
      .catch((err) => {
        console.error("Failed to load active businesses:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getBusinessCategory = (slug: string) => {
    if (slug === "bibe") return "Estética & Bienestar";
    if (slug === "demo-barber") return "Barbería & Estilo";
    return "Servicios Profesionales";
  };

  const getBusinessDescription = (slug: string) => {
    if (slug === "bibe") return "Especialistas en estética facial, corporal, pestañas, cejas y tratamientos capilares avanzados.";
    if (slug === "demo-barber") return "Corte clásico, degradados modernos, perfilado de barba premium y toalla caliente.";
    return "Reserva tus turnos de forma online en simples pasos con confirmación instantánea.";
  };

  return (
    <div className="platform-landing" style={{
      minHeight: "100vh",
      background: "#fcfbf9",
      fontFamily: "'Inter', sans-serif",
      color: "#0f172a",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <header style={{
        padding: "20px max(24px, calc((100vw - 1180px) / 2))",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #1e293b, #0f172a)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.2rem",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)"
          }}>
            TF
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: "1.3rem",
            letterSpacing: "-0.02em",
            color: "#0f172a"
          }}>
            TurnoFácil
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: "rgba(0, 0, 0, 0.04)",
            padding: "6px 12px",
            borderRadius: "20px",
            color: "#475569"
          }}>
            <ShieldCheck size={14} style={{ color: "#10b981" }} />
            <span>Plataforma SaaS Multinquilino</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "70px max(24px, calc((100vw - 1180px) / 2)) 100px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "720px", marginBottom: "60px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(15, 23, 42, 0.05)",
            padding: "8px 16px",
            borderRadius: "999px",
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "#475569",
            marginBottom: "24px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            <Sparkles size={14} style={{ color: "#eab308" }} />
            <span>Reserva rápida e inteligente</span>
          </div>

          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#0f172a",
            marginBottom: "20px"
          }}>
            Encontrá tu negocio y agenda tu <span style={{
              background: "linear-gradient(135deg, #1e293b, #475569)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>turno en segundos</span>
          </h1>

          <p style={{
            fontSize: "1.15rem",
            lineHeight: 1.6,
            color: "#64748b",
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            Elegí cualquiera de nuestros locales autorizados para reservar tus citas en línea de forma 100% autogestionada.
          </p>
        </div>

        {/* Business Grid */}
        {loading ? (
          <div style={{
            padding: "80px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "3px solid rgba(15, 23, 42, 0.1)",
              borderTopColor: "#0f172a",
              animation: "spin 1s linear infinite"
            }}></div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <p style={{ color: "#64748b", fontWeight: 600 }}>Cargando negocios disponibles...</p>
          </div>
        ) : error ? (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "500px",
            textAlign: "center"
          }}>
            <p style={{ color: "#b91c1c", fontWeight: 700, marginBottom: "8px" }}>Ocurrió un error al cargar la plataforma</p>
            <p style={{ color: "#7f1d1d", fontSize: "0.92rem", lineHeight: 1.5 }}>
              Asegúrate de que el servidor backend esté corriendo y vuelve a intentarlo.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "30px",
            width: "100%",
            maxWidth: "960px",
            marginTop: "20px",
            justifyContent: "center"
          }}>
            {businesses.map((biz) => {
              const category = getBusinessCategory(biz.slug);
              const desc = getBusinessDescription(biz.slug);
              const accentColor = biz.primaryColor || "#0f172a";

              return (
                <div key={biz.id} style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                  borderRadius: "20px",
                  padding: "36px 32px",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)",
                  transition: "all 200ms ease",
                  position: "relative",
                  overflow: "hidden"
                }}
                className="platform-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                  e.currentTarget.style.boxShadow = `0 20px 40px ${accentColor}0a, 0 1px 3px ${accentColor}14`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.06)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.02)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}>
                  {/* Decorative glow in corner */}
                  <div style={{
                    position: "absolute",
                    top: "-40px",
                    right: "-40px",
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: accentColor,
                    opacity: 0.04,
                    filter: "blur(20px)",
                    pointerEvents: "none"
                  }}></div>

                  <div>
                    {/* Category badge */}
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: `${accentColor}0a`,
                      color: accentColor,
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      marginBottom: "24px"
                    }}>
                      {biz.slug === "bibe" ? <Sparkles size={12} /> : <Calendar size={12} />}
                      <span>{category}</span>
                    </div>

                    <h2 style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: "12px",
                      letterSpacing: "-0.02em"
                    }}>
                      {biz.name}
                    </h2>

                    <p style={{
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      color: "#64748b",
                      marginBottom: "32px"
                    }}>
                      {desc}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Link to={`/n/${biz.slug}`} style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: accentColor,
                      color: "#ffffff",
                      padding: "14px 20px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      textDecoration: "none",
                      boxShadow: `0 8px 20px ${accentColor}2d`,
                      transition: "opacity 150ms ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                      Reservar turno
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: "40px 24px",
        background: "#f1f5f9",
        borderTop: "1px solid rgba(0, 0, 0, 0.05)",
        textAlign: "center",
        fontSize: "0.88rem",
        color: "#64748b"
      }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 700, color: "#475569" }}>
          <span>TurnoFácil</span>
          <span style={{ fontSize: "0.75rem", padding: "2px 6px", background: "rgba(0,0,0,0.06)", borderRadius: "4px" }}>v2.0 SaaS</span>
        </div>
        <p>© {new Date().getFullYear()} TurnoFácil Platform. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
