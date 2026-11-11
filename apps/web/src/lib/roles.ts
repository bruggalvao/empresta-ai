import type { Role } from "./api/me";

export const ROLE_LABEL: Record<Role, string> = { EMPLOYEE: "Colaborador", OPERATIONS: "Operações" };

// LAYOUT §6: tabs per role.
export const ROLE_TABS: Record<Role, string[]> = {
  EMPLOYEE: ["Catálogo", "Meus empréstimos"],
  OPERATIONS: ["Catálogo", "Operações", "Equipamentos", "Meus empréstimos"],
};

/** First letter of the first and last names: "Marcelo Grilo" → "MG". */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toLocaleUpperCase("pt-BR");
}
