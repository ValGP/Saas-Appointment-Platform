import { CalendarCheck, Clock, LogOut, Menu, Sparkles, UserRound, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthProvider";
import { useActiveBusiness } from "../providers/BusinessProvider";

export function ClientLayout() {
  const { logout, user } = useAuth();
  const { business } = useActiveBusiness();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const initials =
    user?.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "B";

  return (
    <div className="client-shell">
      {isMenuOpen ? (
        <button
          aria-label="Cerrar menu"
          className="client-menu-backdrop"
          type="button"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <header className="client-header">
        <NavLink
          className="client-brand"
          to={`/n/${businessSlug}/app/book`}
          style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "var(--text)" }}
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
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.06)"
            }}
          >
            {business?.name ? business.name[0].toUpperCase() : "T"}
          </span>
          <strong style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-strong)" }}>
            {business?.name || "TurnoFácil"}
          </strong>
        </NavLink>


        <nav
          className={`client-nav ${isMenuOpen ? "is-open" : ""}`}
          aria-label="Navegacion de cliente"
        >
          <NavLink to={`/n/${businessSlug}/app/book`} onClick={() => setIsMenuOpen(false)}>
            <CalendarCheck aria-hidden="true" size={18} />
            Pedir turno
          </NavLink>
          <NavLink to={`/n/${businessSlug}/app/appointments`} onClick={() => setIsMenuOpen(false)}>
            <Clock aria-hidden="true" size={18} />
            Mis turnos
          </NavLink>
          <NavLink to={`/n/${businessSlug}/app/profile`} onClick={() => setIsMenuOpen(false)}>
            <UserRound aria-hidden="true" size={18} />
            Perfil
          </NavLink>

          {/* mobile-only cerrar sesión option */}
          <button
            type="button"
            className="client-nav-logout-mobile"
            onClick={() => {
              setIsMenuOpen(false);
              logout();
            }}
          >
            <LogOut aria-hidden="true" size={18} />
            Cerrar Sesión
          </button>
        </nav>

        <div className="client-user">
          <div className="client-user-copy">
            <strong>{user?.fullName ?? "Cliente"}</strong>
            <small>{user?.email}</small>
          </div>
          <span className="client-avatar">{initials}</span>
          <button
            className="client-logout-btn"
            type="button"
            onClick={logout}
            aria-label="Cerrar sesion"
          >
            <LogOut aria-hidden="true" size={18} />
          </button>
          <button
            className="client-menu-button"
            type="button"
            aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? (
              <X aria-hidden="true" size={20} />
            ) : (
              <Menu aria-hidden="true" size={20} />
            )}
          </button>
        </div>
      </header>

      <main className="client-main">
        <Outlet />
      </main>
    </div>
  );
}

