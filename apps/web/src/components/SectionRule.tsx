// Rule that fades out at both ends (docs/LAYOUT.md section 4).
export function SectionRule() {
  return (
    <div
      aria-hidden="true"
      className="h-px bg-[linear-gradient(90deg,transparent,var(--color-divider)_48px,var(--color-divider)_calc(100%-48px),transparent)]"
    />
  );
}
