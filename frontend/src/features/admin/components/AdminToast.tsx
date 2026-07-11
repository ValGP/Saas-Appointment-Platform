export type AdminToastState = {
  message: string;
  tone?: "success" | "danger";
};

export function AdminToast({ toast }: { toast: AdminToastState | null }) {
  if (!toast) {
    return null;
  }

  return (
    <div className={`admin-toast tone-${toast.tone ?? "success"}`} role="status">
      {toast.message}
    </div>
  );
}
