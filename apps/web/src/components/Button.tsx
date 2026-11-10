import type { ButtonHTMLAttributes } from "react";

// ADR 002 §2.5: primary is a 1px accent outline (never a solid fill),
// secondary a divider outline, ghost accent text only.
type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "border border-accent text-accent-300 hover:bg-accent/12 active:bg-accent/22",
  secondary: "border border-divider text-text hover:bg-accent/12 active:bg-accent/22",
  ghost: "text-accent-300 hover:text-accent-200",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
  size?: "md" | "lg";
};

export function Button({ variant = "primary", block = false, size = "md", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md px-4 text-[14px] font-medium",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-45",
        size === "lg" ? "h-10" : "h-9",
        block ? "w-full" : "",
        VARIANTS[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
