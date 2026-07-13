import { Navigate, Outlet, useLocation } from "react-router-dom";
import { type UserRole } from "../../../shared/types/user";
import { useAuth } from "../context/AuthProvider";

type AuthGateProps = {
  allow: UserRole;
};

export function AuthGate({ allow }: AuthGateProps) {
  const { status, user } = useAuth();
  const location = useLocation();
  const businessSlug = window.location.pathname.match(/^\/n\/([^/]+)/)?.[1] || "bibe";

  if (status === "loading") {
    return <div className="route-loading">Cargando sesion...</div>;
  }

  if (!user) {
    return <Navigate to={`/n/${businessSlug}/login`} replace state={{ from: location }} />;
  }

  if (user.role !== allow) {
    return <Navigate to={user.role === "ADMIN" ? `/n/${businessSlug}/admin` : `/n/${businessSlug}/app`} replace />;
  }

  return <Outlet />;
}
