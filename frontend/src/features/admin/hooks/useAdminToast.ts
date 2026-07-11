import { useCallback, useEffect, useState } from "react";
import { type AdminToastState } from "../components/AdminToast";

export function useAdminToast() {
  const [toast, setToast] = useState<AdminToastState | null>(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showToast = useCallback((message: string, tone: AdminToastState["tone"] = "success") => {
    setToast({ message, tone });
  }, []);

  return { showToast, toast };
}
