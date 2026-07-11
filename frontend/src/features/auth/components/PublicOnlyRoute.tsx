import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export function PublicOnlyRoute() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return <div className="route-loading">Cargando sesion...</div>;
  }

  if (user) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/app"} replace />;
  }

  return <Outlet />;
}
