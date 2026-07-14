import { Menu, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useActiveBusiness } from "../providers/BusinessProvider";

export function PublicLayout() {
  const location = useLocation();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { business } = useActiveBusiness();
  const headerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isInternalPublicPage = location.pathname !== `/n/${businessSlug}`;

  function closeMenus() {
    setIsMobileMenuOpen(false);
  }

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 40);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    closeMenus();
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash) {
      window.requestAnimationFrame(() => {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: "auto", block: "start" });
      });
      return;
    }

    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        isMobileMenuOpen &&
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        closeMenus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMobileMenuOpen]);

  const waNumber = business?.whatsapp ? business.whatsapp.replace(/\s+/g, "") : "";

  return (
    <div className="public-shell" style={{ background: "var(--bg)" }}>
      <header
        ref={headerRef}
        className={`site-header ${
          isScrolled || isInternalPublicPage ? "is-scrolled" : ""
        }`}
      >
        <NavLink
          className="brand"
          to={`/n/${businessSlug}`}
          aria-label="Inicio"
          onClick={closeMenus}
          style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text)" }}
        >
          <span
            className="brand-logo"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--primary)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "16px",
              boxShadow: "0 4px 10px var(--shadow-color)"
            }}
          >
            {business?.name ? business.name[0].toUpperCase() : "T"}
          </span>
          <strong style={{ fontSize: "18px", letterSpacing: "-0.02em", fontFamily: "var(--font-heading)" }}>
            {business?.name ?? "Turnos"}
          </strong>
        </NavLink>

        <button
          className="public-menu-button"
          type="button"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          aria-expanded={isMobileMenuOpen}
          aria-label={
            isMobileMenuOpen ? "Cerrar navegacion" : "Abrir navegacion"
          }
        >
          {isMobileMenuOpen ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu aria-hidden="true" size={20} />
          )}
        </button>

        {isMobileMenuOpen && (
          <button
            className="public-menu-backdrop"
            type="button"
            aria-label="Cerrar menu"
            onPointerDown={closeMenus}
            onClick={closeMenus}
          />
        )}

        <nav
          className={`nav-links ${isMobileMenuOpen ? "is-open" : ""}`}
          aria-label="Navegacion publica"
        >
          <a href={`/n/${businessSlug}#inicio`} onClick={closeMenus}>
            Inicio
          </a>
          <a href={`/n/${businessSlug}#servicios`} onClick={closeMenus}>
            Servicios
          </a>
          {waNumber && (
            <a href={`/n/${businessSlug}#contacto`} onClick={closeMenus}>
              Contacto
            </a>
          )}
          <NavLink to={`/n/${businessSlug}/login`} onClick={closeMenus}>
            Ingresar
          </NavLink>
          <NavLink className="public-nav-cta" to={`/n/${businessSlug}/book`} onClick={closeMenus}>
            <Sparkles aria-hidden="true" size={16} />
            Agendar
          </NavLink>
        </nav>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      {waNumber && (
        <a
          href={`https://wa.me/${waNumber}`}
          className="whatsapp-float-btn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          title="Contactar por WhatsApp"
        >
          <img
            src="/icon/whatsapp.png"
            alt="WhatsApp"
            className="whatsapp-float-img"
          />
        </a>
      )}
    </div>
  );
}
