// Dates in the interface: DD/MM/AAAA (ADR 002 §2.7), "today" in
// America/Sao_Paulo like the API (modelagem-dados.md, decisão 4).
const TZ = "America/Sao_Paulo";

/** "2026-11-24" → "24/11/2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Calendar date of an instant in São Paulo, as "YYYY-MM-DD". */
export function saoPauloDate(instant: Date | string = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof instant === "string" ? new Date(instant) : instant,
  );
}

/** "YYYY-MM-DD" + n calendar days. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
