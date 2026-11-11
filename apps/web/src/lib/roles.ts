import type { Role } from "./api/types";

export const ROLE_LABEL: Record<Role, string> = { EMPLOYEE: "Colaborador", OPERATIONS: "Operações" };

export type Tab = { label: string; to?: string };

// LAYOUT §6, except that Operations has no "Meus empréstimos": only a
// Colaborador borrows (spec solicitar-emprestimo, decisões). Tabs without
// `to` are screens that do not exist yet and stay disabled.
export const ROLE_TABS: Record<Role, Tab[]> = {
  EMPLOYEE: [
    { label: "Catálogo", to: "/catalogo" },
    { label: "Meus empréstimos", to: "/meus-emprestimos" },
  ],
  OPERATIONS: [{ label: "Catálogo", to: "/catalogo" }, { label: "Operações" }, { label: "Equipamentos" }],
};

/** First letter of the first and last names: "Marcelo Grilo" → "MG". */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toLocaleUpperCase("pt-BR");
}
