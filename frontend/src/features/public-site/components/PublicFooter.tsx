import { Mail, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";

const footerLinks = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#tratamientos", label: "Tratamientos" },
  { href: "/#sobre", label: "Sobre BIBE" },
  { href: "/#resultados", label: "Resultados" },
  { href: "/#contacto", label: "Contacto" },
];

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-brand">
        <span className="footer-brand-logo">
          <img alt="" src="/icon/blanco.png" />
        </span>
        <div>
          <strong>BIBE</strong>
          <small>Salud y estetica</small>
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
        <span>
          <Phone aria-hidden="true" size={16} />
          Contacto a definir
        </span>
        <span>
          <MapPin aria-hidden="true" size={16} />
          Direccion a definir
        </span>
        <span>
          <Mail aria-hidden="true" size={16} />
          Email a definir
        </span>
      </div>
      <div className="public-footer-social">
        <a href="/#contacto" aria-label="Instagram">
          <Sparkles aria-hidden="true" size={18} />
        </a>
        <a href="/#contacto" aria-label="WhatsApp">
          <MessageCircle aria-hidden="true" size={18} />
        </a>
      </div>
    </footer>
  );
}
