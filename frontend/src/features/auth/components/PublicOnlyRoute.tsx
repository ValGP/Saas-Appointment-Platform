import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export function PublicOnlyRoute() {
  const { status, user } = useAuth();
  const businessSlug = window.location.pathname.match(/^\/n\/([^/]+)/)?.[1] || "bibe";

  if (status === "loading") {
    return <div className="route-loading">Cargando sesion...</div>;
  }

  if (user) {
    return <Navigate to={user.role === "ADMIN" ? `/n/${businessSlug}/admin` : `/n/${businessSlug}/app`} replace />;
  }

  return <Outlet />;
}
