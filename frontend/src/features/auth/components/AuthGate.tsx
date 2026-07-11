import { Navigate, Outlet, useLocation } from "react-router-dom";
import { type UserRole } from "../../../shared/types/user";
import { useAuth } from "../context/AuthProvider";

type AuthGateProps = {
  allow: UserRole;
};

export function AuthGate({ allow }: AuthGateProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <div className="route-loading">Cargando sesion...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== allow) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/app"} replace />;
  }

  return <Outlet />;
}
