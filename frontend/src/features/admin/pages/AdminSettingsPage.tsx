import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Save, CheckCircle2 } from "lucide-react";
import { getMyBusiness, updateMyBusiness } from "../api/businessApi";

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8f4963");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const businessQuery = useQuery({
    queryKey: ["admin-my-business"],
    queryFn: getMyBusiness,
  });

  useEffect(() => {
    if (businessQuery.data) {
      const biz = businessQuery.data;
      setName(biz.name || "");
      setWhatsapp(biz.whatsapp || "");
      setPrimaryColor(biz.primaryColor || "#8f4963");
    }
  }, [businessQuery.data]);

  const updateMutation = useMutation({
    mutationFn: updateMyBusiness,
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-my-business"], data);
      // Invalidate the public configuration query to update branding/colors globally
      void queryClient.invalidateQueries({ queryKey: ["active-business"] });
      // Apply the color directly in real-time
      if (data.primaryColor) {
        document.documentElement.style.setProperty("--primary", data.primaryColor);
      }
      setSuccessMessage("Configuración guardada exitosamente.");
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMessage("No se pudieron guardar los cambios. Intenta nuevamente.");
      setSuccessMessage(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    updateMutation.mutate({
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      primaryColor,
      showBranding: businessQuery.data?.showBranding ?? true,
    });
  };

  if (businessQuery.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px", color: "var(--admin-text)" }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: "12px", fontSize: "18px" }}>Cargando configuración de la empresa...</span>
      </div>
    );
  }

  if (businessQuery.isError) {
    return (
      <div style={{ padding: "40px", color: "var(--admin-text)", textAlign: "center" }}>
        <h3>Error al cargar los datos</h3>
        <p>No se pudo conectar con el servidor.</p>
        <button className="admin-soft-button" onClick={() => void businessQuery.refetch()}>Reintentar</button>
      </div>
    );
  }

  return (
    <section className="catalog-page" style={{ color: "var(--admin-text)" }}>
      <div className="catalog-header">
        <div>
          <p className="admin-kicker">Configuración</p>
          <h2>Mi Empresa</h2>
          <p>Personalizá los datos de contacto, la paleta de colores y la marca de tu negocio en la plataforma.</p>
        </div>
      </div>

      <div style={{ maxWidth: "600px", background: "var(--admin-surface, #1e293b)", padding: "24px", borderRadius: "12px", border: "1px solid var(--line, #334155)", marginTop: "24px" }}>
        <form onSubmit={handleSubmit}>
          {successMessage && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", color: "#10b981", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
              <span>{errorMessage}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
                Nombre del Negocio
              </label>
              <input
                className="admin-form-input"
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--line)", background: "rgba(0,0,0,0.1)", color: "inherit" }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
                WhatsApp de Contacto (con código de país)
              </label>
              <input
                className="admin-form-input"
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--line)", background: "rgba(0,0,0,0.1)", color: "inherit" }}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 5491123456789"
                maxLength={40}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
                Color de Marca Principal
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{
                    width: "60px",
                    height: "40px",
                    padding: "0",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: "none"
                  }}
                />
                <span style={{ fontFamily: "monospace", fontSize: "14px" }}>{primaryColor.toUpperCase()}</span>
              </div>
              <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                Este color definirá la identidad visual en tu portal de reservas (botones, hover, pestañas y acentos).
              </small>
            </div>


            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="admin-primary-button"
                disabled={updateMutation.isPending}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Save size={16} />
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
