import { CalendarCheck, Clock, LogOut, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthProvider";

export function ClientLayout() {
  const { logout, user } = useAuth();
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
        <NavLink className="client-brand" to={`/n/${businessSlug}/app/book`} aria-label="Cliente">
          <span className="brand-logo">
            <img alt="" src="/icon/blanco.png" />
          </span>
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
        </nav>

        <div className="client-user">
          <div className="client-user-copy">
            <strong>{user?.fullName ?? "Cliente"}</strong>
            <small>{user?.email}</small>
          </div>
          <span className="client-avatar">{initials}</span>
          <button type="button" onClick={logout} aria-label="Cerrar sesion">
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
