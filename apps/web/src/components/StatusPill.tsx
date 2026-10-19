export type EquipmentStatus = "available" | "loaned" | "late" | "maintenance";

const STATUS: Record<EquipmentStatus, { label: string; classes: string }> = {
  available: {
    label: "Disponível",
    classes:
      "text-status-ok-fg bg-status-ok-bg border-status-ok-bd",
  },
  loaned: {
    label: "Emprestado",
    classes:
      "text-status-warn-fg bg-status-warn-bg border-status-warn-bd",
  },
  late: {
    label: "Em atraso",
    classes:
      "text-status-late-fg bg-status-late-bg border-status-late-bd",
  },
  maintenance: {
    label: "Em manutenção",
    classes: "text-status-off-fg bg-status-off-bg border-status-off-bd",
  },
};

// The label is always rendered: status is never conveyed by color alone (ADR 002).
export function StatusPill({ status }: { status: EquipmentStatus }) {
  const { label, classes } = STATUS[status];

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-[9px] py-[3px] text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
