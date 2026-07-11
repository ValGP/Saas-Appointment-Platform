import { type ReactNode } from "react";

type AdminEmptyStateProps = {
  action?: ReactNode;
  label: string;
  supportingText?: string;
};

export function AdminEmptyState({
  action,
  label,
  supportingText,
}: AdminEmptyStateProps) {
  return (
    <div className="admin-empty-state">
      <div>
        <strong>{label}</strong>
        {supportingText ? <p>{supportingText}</p> : null}
      </div>
      {action ? <div className="admin-empty-state-action">{action}</div> : null}
    </div>
  );
}
