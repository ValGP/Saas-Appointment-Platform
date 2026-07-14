import { Mail, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { useParams } from "react-router-dom";
import { useActiveBusiness } from "../../../app/providers/BusinessProvider";

export function PublicFooter() {
  const { business } = useActiveBusiness();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const showSaasBranding = business?.showBranding !== false;

  const footerLinks = [
    { href: `/n/${businessSlug}#inicio`, label: "Inicio" },
    { href: `/n/${businessSlug}#tratamientos`, label: "Servicios" },
    { href: `/n/${businessSlug}#contacto`, label: "Contacto" },
  ];

  return (
    <footer className="public-footer">
      <div className="public-footer-brand">
        <span className="footer-brand-logo">
          <img alt="" src="/icon/blanco.png" />
        </span>
        <div>
          <strong>{business?.name ?? "BIBE"}</strong>
          <small>{business?.slug === "bibe" ? "Salud y estética" : "Reserva de Turnos"}</small>
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
        <span>
          <Mail aria-hidden="true" size={16} />
          {business?.slug === "bibe" ? "Email a definir" : "Contacto vía web"}
        </span>
      </div>
      <div className="public-footer-social">
        <a href={`/n/${businessSlug}#contacto`} aria-label="Instagram">
          <Sparkles aria-hidden="true" size={18} />
        </a>
        {business?.whatsapp && (
          <a href={`https://wa.me/${business.whatsapp.replace(/\s+/g, "")}`} aria-label="WhatsApp" target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden="true" size={18} />
          </a>
        )}
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
