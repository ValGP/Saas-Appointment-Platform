import { AdminModal } from "./AdminModal";

type AdminConfirmDialogProps = {
  confirmLabel: string;
  isPending?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: "danger" | "primary";
};

export function AdminConfirmDialog({
  confirmLabel,
  isPending = false,
  message,
  onCancel,
  onConfirm,
  title,
  tone = "primary",
}: AdminConfirmDialogProps) {
  return (
    <AdminModal
      kicker="Confirmacion"
      title={title}
      onClose={onCancel}
      stack="top"
    >
      <p className="confirm-message">{message}</p>
      <div className="form-actions">
        <button className="admin-soft-button" type="button" onClick={onCancel}>
          Volver
        </button>
        <button
          className={tone === "danger" ? "admin-danger-button" : "admin-primary-button"}
          type="button"
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? "Procesando..." : confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}
