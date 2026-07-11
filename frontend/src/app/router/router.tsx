import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { ClientLayout } from "../layouts/ClientLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { AuthGate } from "../../features/auth/components/AuthGate";
import { PublicOnlyRoute } from "../../features/auth/components/PublicOnlyRoute";
import { AdminDashboardPage } from "../../features/admin/pages/AdminDashboardPage";
import { AdminAppointmentsPage } from "../../features/admin/pages/AdminAppointmentsPage";
import { AdminAvailabilityBlocksPage } from "../../features/admin/pages/AdminAvailabilityBlocksPage";
import { AdminBusinessHoursPage } from "../../features/admin/pages/AdminBusinessHoursPage";
import { AdminCalendarPage } from "../../features/admin/pages/AdminCalendarPage";
import { AdminClientsPage } from "../../features/admin/pages/AdminClientsPage";
import { AdminProfessionalsPage } from "../../features/admin/pages/AdminProfessionalsPage";
import { AdminServicesPage } from "../../features/admin/pages/AdminServicesPage";
import { ClientAppointmentsPage } from "../../features/client/pages/ClientAppointmentsPage";
import { ClientBookingSuccessPage } from "../../features/client/pages/ClientBookingSuccessPage";
import { ClientBookPage } from "../../features/client/pages/ClientBookPage";
import { ClientProfilePage } from "../../features/client/pages/ClientProfilePage";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";
import { HomePage } from "../../features/public-site/pages/HomePage";
import { TreatmentCategoryPage } from "../../features/public-site/pages/TreatmentCategoryPage";
import { NotFoundPage } from "../../shared/components/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/tratamientos/:slug", element: <TreatmentCategoryPage /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <AuthGate allow="CLIENT" />,
    children: [
      {
        path: "/app",
        element: <ClientLayout />,
        children: [
          { index: true, element: <Navigate to="/app/book" replace /> },
          { path: "book", element: <ClientBookPage /> },
          { path: "book/success", element: <ClientBookingSuccessPage /> },
          { path: "appointments", element: <ClientAppointmentsPage /> },
          { path: "profile", element: <ClientProfilePage /> },
        ],
      },
    ],
  },
  {
    element: <AuthGate allow="ADMIN" />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboardPage /> },
          {
            path: "appointments",
            element: <AdminAppointmentsPage />,
          },
          { path: "calendar", element: <AdminCalendarPage /> },
          {
            path: "services",
            element: <AdminServicesPage />,
          },
          {
            path: "professionals",
            element: <AdminProfessionalsPage />,
          },
          {
            path: "business-hours",
            element: <AdminBusinessHoursPage />,
          },
          {
            path: "availability-blocks",
            element: <AdminAvailabilityBlocksPage />,
          },
          { path: "clients", element: <AdminClientsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
