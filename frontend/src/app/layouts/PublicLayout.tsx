import { Menu, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { treatmentCategories } from "../../features/public-site/data/treatmentContent";

export function PublicLayout() {
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const treatmentsMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTreatmentsOpen, setIsTreatmentsOpen] = useState(false);
  const isInternalPublicPage = location.pathname !== "/";

  function closeMenus() {
    setIsMobileMenuOpen(false);
    setIsTreatmentsOpen(false);
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
        return;
      }

      if (
        treatmentsMenuRef.current &&
        !treatmentsMenuRef.current.contains(event.target as Node)
      ) {
        setIsTreatmentsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="public-shell">
      <header
        ref={headerRef}
        className={`site-header ${
          isScrolled || isInternalPublicPage ? "is-scrolled" : ""
        }`}
      >
        <NavLink className="brand" to="/" aria-label="Inicio BIBE" onClick={closeMenus}>
          <span className="brand-logo">
            <img alt="" src="/icon/blanco.png" />
          </span>
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
        {isMobileMenuOpen ? (
          <button
            className="public-menu-backdrop"
            type="button"
            aria-label="Cerrar menu"
            onPointerDown={closeMenus}
            onClick={closeMenus}
          />
        ) : null}
        <nav
          className={`nav-links ${isMobileMenuOpen ? "is-open" : ""}`}
          aria-label="Navegacion publica"
        >
          <a href="/#inicio" onClick={closeMenus}>
            Inicio
          </a>
          <div
            ref={treatmentsMenuRef}
            className={`public-nav-menu ${isTreatmentsOpen ? "is-open" : ""}`}
            onMouseEnter={() => {
              if (!window.matchMedia("(max-width: 900px)").matches) {
                setIsTreatmentsOpen(true);
              }
            }}
            onMouseLeave={() => {
              if (!window.matchMedia("(max-width: 900px)").matches) {
                setIsTreatmentsOpen(false);
              }
            }}
          >
            <button
              className="public-nav-trigger"
              type="button"
              onClick={() => {
                if (window.matchMedia("(max-width: 900px)").matches) {
                  setIsTreatmentsOpen((current) => !current);
                  return;
                }

                setIsTreatmentsOpen(true);
              }}
              aria-expanded={isTreatmentsOpen}
            >
              Tratamientos
            </button>
            <div className="public-nav-dropdown">
              {treatmentCategories.map((category) => (
                <Link
                  to={`/tratamientos/${category.slug}`}
                  key={category.slug}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsTreatmentsOpen(false);
                  }}
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </div>
          <a href="/#contacto" onClick={closeMenus}>
            Contacto
          </a>
          <NavLink to="/login" onClick={closeMenus}>
            Ingresar
          </NavLink>
          <NavLink className="public-nav-cta" to="/register" onClick={closeMenus}>
            <Sparkles aria-hidden="true" size={16} />
            Agendar
          </NavLink>
        </nav>
      </header>
      <main className="public-main">
        <Outlet />
      </main>

      <a
        href="https://wa.me/5491123456789"
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
    </div>
  );
}

