type AdminConflictBadgeProps = {
  label: string;
  tone?: "danger" | "warning";
};

export function AdminConflictBadge({
  label,
  tone = "warning",
}: AdminConflictBadgeProps) {
  return <span className={`admin-conflict-badge tone-${tone}`}>{label}</span>;
}
