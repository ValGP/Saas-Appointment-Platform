import { X } from "lucide-react";
import { type ReactNode } from "react";

type AdminModalProps = {
  children: ReactNode;
  kicker: string;
  onClose: () => void;
  stack?: "base" | "top";
  title: string;
};

export function AdminModal({
  children,
  kicker,
  onClose,
  stack = "base",
  title,
}: AdminModalProps) {
  return (
    <div
      className={`admin-modal-backdrop ${stack === "top" ? "is-top" : ""}`}
      role="presentation"
    >
      <section className="admin-modal" role="dialog" aria-modal="true">
        <div className="card-heading">
          <div>
            <p className="admin-kicker">{kicker}</p>
            <h3>{title}</h3>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
