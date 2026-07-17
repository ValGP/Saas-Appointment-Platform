import { MapPin, Phone } from "lucide-react";
import { useParams } from "react-router-dom";
import { useActiveBusiness } from "../../../app/providers/BusinessProvider";

export function PublicFooter() {
  const { business } = useActiveBusiness();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const showSaasBranding = business?.showBranding !== false;

  const footerLinks = [
    { href: `/n/${businessSlug}#inicio`, label: "Inicio" },
    { href: `/n/${businessSlug}#servicios`, label: "Servicios" },
    { href: `/n/${businessSlug}#contacto`, label: "Contacto" },
  ];

  return (
    <footer className="public-footer">
      <div className="public-footer-brand" style={{ display: "flex", alignItems: "center" }}>
        <span className="footer-brand-logo-generic" style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "#ffffff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "16px",
          marginRight: "12px",
          flexShrink: 0
        }}>
          {business?.name ? business.name[0].toUpperCase() : "T"}
        </span>
        <div>
          <strong style={{ display: "block" }}>{business?.name ?? "BIBE"}</strong>
          <small style={{ opacity: 0.7 }}>{business?.slug === "bibe" ? "Salud y estética" : "Reserva de Turnos"}</small>
        </div>
      </div>
      <nav aria-label="Links principales">
        {footerLinks.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="public-footer-contact">
        {business?.whatsapp && (
          <span>
            <Phone aria-hidden="true" size={16} />
            {business.whatsapp}
          </span>
        )}
        <span>
          <MapPin aria-hidden="true" size={16} />
          {business?.slug === "bibe" ? "Dirección a definir" : "Atención online / local"}
        </span>
      </div>

      {showSaasBranding && (
        <div className="saas-branding" style={{ width: "100%", textAlign: "center", marginTop: "30px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", opacity: 0.7 }}>
          <span>Powered by </span>
          <a href="/" style={{ fontWeight: "bold", textDecoration: "underline", color: "inherit" }}>TurnoFácil</a>
          <span> - Creá tu agenda online gratis</span>
        </div>
      )}
    </footer>
  );
}
