type BrandProps = {
  size?: "sm" | "md";
};

const SIZES = {
  sm: { mark: "size-[22px]", dot: "size-2", text: "text-[15px]" },
  md: { mark: "size-[26px]", dot: "size-[9px]", text: "text-[17px]" },
} as const;

export function Brand({ size = "sm" }: BrandProps) {
  const s = SIZES[size];

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`${s.mark} grid place-items-center rounded-[6px] border-[1.5px] border-accent`}
      >
        <span className={`${s.dot} rounded-[2px] bg-accent`} />
      </span>
      <span className={`${s.text} font-bold tracking-[0.02em]`}>
        EMPREST<span className="text-accent">.AI</span>
      </span>
    </span>
  );
}
