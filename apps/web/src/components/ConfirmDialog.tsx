import { type ReactNode, useEffect, useId } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  title: string;
  children: ReactNode;
  summary: { label: string; value: string }[];
  confirmLabel: string;
  pending?: boolean;
  error?: string | null;
  onConfirm(): void;
  onCancel(): void;
};

// LAYOUT §5.6: 420px modal; backdrop click and Esc close; click inside does not.
export function ConfirmDialog({ title, children, summary, confirmLabel, pending, error, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div data-testid="dialog-backdrop" className="fixed inset-0 z-30 grid place-items-center bg-[rgb(10_11_18/0.68)] p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-[420px] animate-fade-up flex-col gap-4 rounded-lg border border-divider bg-surface p-[26px] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-[20px]">
          {title}
        </h2>
        <div className="text-[14px] text-text/62">{children}</div>
        <dl className="flex flex-col gap-2 rounded-md border border-divider px-4 py-3.5">
          {summary.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 text-[13.5px]">
              <dt className="text-text/55">{row.label}</dt>
              <dd className="font-medium text-accent-300">{row.value}</dd>
            </div>
          ))}
        </dl>
        {error ? (
          <p role="alert" className="rounded-md border border-[#7a3b3b] bg-[rgb(122_59_59/0.14)] px-3 py-2 text-[13px] text-status-late-fg">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? "Registrando…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
