import { forwardRef, type InputHTMLAttributes, useId } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

// ADR 002 §2.5 Field / Input: label above a 36px input on the surface color.
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, id, ...props }, ref) {
  const generated = useId();
  const inputId = id ?? generated;
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[12.5px] text-text/70">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          "h-9 rounded-md border bg-surface px-2.5 text-[14px] text-text placeholder:text-text/40",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          error ? "border-status-late-bd" : "border-divider",
        ].join(" ")}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-[12.5px] text-status-late-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
});
