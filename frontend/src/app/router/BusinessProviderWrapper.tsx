import { Outlet } from "react-router-dom";
import { BusinessProvider } from "../providers/BusinessProvider";

export function BusinessProviderWrapper() {
  return (
    <BusinessProvider>
      <Outlet />
    </BusinessProvider>
  );
}
