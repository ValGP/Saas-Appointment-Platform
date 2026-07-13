import {
  BadgeCheck,
  Blocks,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useTheme } from "../providers/ThemeProvider";
import { AdminConfirmDialog } from "../../features/admin/components/AdminConfirmDialog";
import { useAuth } from "../../features/auth/context/AuthProvider";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/appointments", label: "Turnos", icon: BadgeCheck },
  { to: "/admin/calendar", label: "Agenda", icon: CalendarDays },
  { to: "/admin/services", label: "Servicios", icon: Sparkles },
  { to: "/admin/professionals", label: "Profesionales", icon: BriefcaseBusiness },
  { to: "/admin/business-hours", label: "Horarios", icon: Clock3 },
  { to: "/admin/availability-blocks", label: "Bloqueos", icon: Blocks },
  { to: "/admin/clients", label: "Clientes", icon: UsersRound },
];

export function AdminLayout() {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const location = useLocation();
  const isDark = theme === "dark";

  const resolvedLinks = adminLinks.map((link) => ({
    ...link,
    to: link.to.replace("/admin", `/n/${businessSlug}/admin`),
  }));

  const currentLink =
    resolvedLinks.find((link) => location.pathname.startsWith(link.to)) ??
    resolvedLinks[0];

  return (
    <div className={`admin-shell admin-theme-${theme}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <NavLink
            className="admin-brand"
            to={`/n/${businessSlug}/admin`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="admin-brand-mark">B</span>
            <span>
              <strong>BIBE</strong>
              <small>Estetica Admin</small>
            </span>
          </NavLink>

          <button
            className="admin-menu-button"
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-expanded={isMobileMenuOpen}
            aria-label={
              isMobileMenuOpen
                ? "Cerrar navegacion administrativa"
                : "Abrir navegacion administrativa"
            }
          >
            {isMobileMenuOpen ? (
              <X aria-hidden="true" size={20} />
            ) : (
              <Menu aria-hidden="true" size={20} />
            )}
          </button>
        </div>

        <nav
          className={`admin-nav ${isMobileMenuOpen ? "is-open" : ""}`}
          aria-label="Navegacion administrativa"
        >
          {resolvedLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={2.1} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}

          <div className="admin-nav-actions">
            <button
              className="admin-nav-action-btn"
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Usar modo claro" : "Usar modo oscuro"}
              aria-label={isDark ? "Usar modo claro" : "Usar modo oscuro"}
            >
              {isDark ? (
                <>
                  <Sun aria-hidden="true" size={18} />
                  <span>Modo claro</span>
                </>
              ) : (
                <>
                  <Moon aria-hidden="true" size={18} />
                  <span>Modo oscuro</span>
                </>
              )}
            </button>

            <button
              className="admin-nav-action-btn logout-btn"
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLogoutConfirmOpen(true);
              }}
              title="Cerrar sesion"
              aria-label="Cerrar sesion"
            >
              <LogOut aria-hidden="true" size={18} />
              <span>Salir</span>
            </button>
          </div>
        </nav>

        <div className="admin-user-card">
          <span className="admin-user-avatar">
            <UserRound aria-hidden="true" size={17} />
          </span>
          <span>
            <strong>{user?.fullName}</strong>
            <small>{user?.email}</small>
          </span>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Panel administrativo</p>
            <h1>{currentLink.label}</h1>
          </div>

          <div className="admin-header-actions">
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Usar modo claro" : "Usar modo oscuro"}
              aria-label={isDark ? "Usar modo claro" : "Usar modo oscuro"}
            >
              {isDark ? (
                <Sun aria-hidden="true" size={18} />
              ) : (
                <Moon aria-hidden="true" size={18} />
              )}
            </button>

            <button
              className="icon-button"
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              title="Cerrar sesion"
              aria-label="Cerrar sesion"
            >
              <LogOut aria-hidden="true" size={18} />
            </button>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>

      {isLogoutConfirmOpen ? (
        <AdminConfirmDialog
          title="Cerrar sesion"
          message="Vas a cerrar la sesion actual."
          confirmLabel="Cerrar sesion"
          tone="danger"
          onCancel={() => setIsLogoutConfirmOpen(false)}
          onConfirm={logout}
        />
      ) : null}
    </div>
  );
}
