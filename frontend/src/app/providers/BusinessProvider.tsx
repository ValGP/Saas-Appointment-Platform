import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../shared/api/httpClient";

export type BusinessConfig = {
  id: number;
  name: string;
  slug: string;
  timezone: string;
  whatsapp: string;
  primaryColor: string;
  themePreset: string;
  bookingEnabled: boolean;
  showBranding: boolean;
};

type BusinessContextValue = {
  business: BusinessConfig | null;
  loading: boolean;
  error: Error | null;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: PropsWithChildren) {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [business, setBusiness] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!businessSlug) return;

    // Inyectar instantáneamente el color guardado en caché para evitar destellos visuales
    const cachedColor = localStorage.getItem(`tf.color.${businessSlug}`);
    if (cachedColor) {
      document.documentElement.style.setProperty("--primary", cachedColor);
    }

    setLoading(true);
    setError(null);

    apiRequest<BusinessConfig>(`/api/public/businesses/${businessSlug}`)
      .then((data) => {
        setBusiness(data);
        if (data.primaryColor) {
          document.documentElement.style.setProperty("--primary", data.primaryColor);
          localStorage.setItem(`tf.color.${businessSlug}`, data.primaryColor);
        }
      })
      .catch((err) => {
        console.error("Failed to load business config:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [businessSlug]);

  return (
    <BusinessContext.Provider value={{ business, loading, error }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useActiveBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useActiveBusiness must be used within a BusinessProvider");
  }
  return context;
}
export default BusinessProvider;
