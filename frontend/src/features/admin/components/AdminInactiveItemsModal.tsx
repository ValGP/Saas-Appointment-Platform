import { Power } from "lucide-react";
import { AdminModal } from "./AdminModal";

export type AdminInactiveItem = {
  id: number;
  title: string;
  description: string;
};

type AdminInactiveItemsModalProps = {
  emptyLabel: string;
  items: AdminInactiveItem[];
  onClose: () => void;
  onReactivate: (id: number) => void;
  title: string;
};

export function AdminInactiveItemsModal({
  emptyLabel,
  items,
  onClose,
  onReactivate,
  title,
}: AdminInactiveItemsModalProps) {
  return (
    <AdminModal kicker="Inactivos" title={title} onClose={onClose}>
      {items.length === 0 ? (
        <div className="dashboard-state">{emptyLabel}</div>
      ) : (
        <div className="inactive-list">
          {items.map((item) => (
            <article className="inactive-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
              <button
                className="admin-soft-button"
                type="button"
                onClick={() => onReactivate(item.id)}
              >
                <Power aria-hidden="true" size={16} />
                Reactivar
              </button>
            </article>
          ))}
        </div>
      )}
    </AdminModal>
  );
}
