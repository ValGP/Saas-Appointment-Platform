import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export type AdminActionMenuItem = {
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "danger" | "default";
};

type AdminActionsMenuProps = {
  items: AdminActionMenuItem[];
  label: string;
};

export function AdminActionsMenu({ items, label }: AdminActionsMenuProps) {
  const menuId = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOtherMenus(event: Event) {
      if (
        event instanceof CustomEvent &&
        event.detail?.menuId !== menuId
      ) {
        detailsRef.current?.removeAttribute("open");
      }
    }

    function closeOnOutsideClick(event: MouseEvent) {
      const menu = detailsRef.current;

      if (!menu?.open || !(event.target instanceof Node)) {
        return;
      }

      if (!menu.contains(event.target)) {
        menu.removeAttribute("open");
      }
    }

    window.addEventListener("admin-actions-menu-open", closeOtherMenus);
    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      window.removeEventListener("admin-actions-menu-open", closeOtherMenus);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [menuId]);

  function handleToggle() {
    if (!detailsRef.current?.open) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("admin-actions-menu-open", {
        detail: { menuId },
      }),
    );
  }

  return (
    <details
      className="admin-actions-menu"
      onToggle={handleToggle}
      ref={detailsRef}
    >
      <summary aria-label={label}>
        <MoreHorizontal aria-hidden="true" size={18} />
      </summary>
      <div className="admin-actions-menu-list">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              className={`admin-actions-menu-item tone-${item.tone ?? "default"}`}
              disabled={item.disabled}
              key={item.label}
              type="button"
              onClick={(event) => {
                event.currentTarget.closest("details")?.removeAttribute("open");
                item.onClick();
              }}
            >
              <Icon aria-hidden="true" size={16} />
              {item.label}
            </button>
          );
        })}
      </div>
    </details>
  );
}
