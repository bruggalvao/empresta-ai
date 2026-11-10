import type { EquipmentStatus } from "../components/StatusPill";
import type { CatalogItem, Category, Role } from "./api/types";
import { formatDate } from "./dates";

export const CATEGORY_LABEL: Record<Category, string> = {
  NOTEBOOK: "Notebook",
  MONITOR: "Monitor",
  CABLE: "Cabo",
  CAMERA: "Câmera",
  ACCESSORY: "Acessório",
};

export type CardAction =
  | { kind: "none" }
  | { kind: "request"; label: "Solicitar" }
  | { kind: "disabled"; label: string; variant: "primary" | "secondary" };

export type CardState = { pill: EquipmentStatus; detail: string; action: CardAction };

export type Borrower = { role: Role; openLoans: number; loanLimit: number; hasOverdue: boolean };

// Spec solicitar-emprestimo, "situação no catálogo" and LAYOUT §7.4–7.7.
// Derived on every render from domain state (ADR 002 §2.5), never stored.
export function cardState(item: CatalogItem, who: Borrower): CardState {
  const view = (pill: EquipmentStatus, detail: string, label?: string): CardState => ({
    pill,
    detail,
    action: who.role !== "EMPLOYEE" || !label ? { kind: "none" } : { kind: "disabled", label, variant: "primary" },
  });

  switch (item.situation) {
    case "MAINTENANCE":
      return view("maintenance", item.notes?.trim() || "Em manutenção, sem previsão de retorno", "Indisponível");
    case "LOANED":
      return view("loaned", "Emprestado no momento", "Emprestado");
    case "MINE":
      return view(
        item.overdue ? "late" : "loaned",
        `Com você · devolver até ${item.dueDate ? formatDate(item.dueDate) : "—"}`,
        "Está com você",
      );
    case "AVAILABLE": {
      const state = view("available", "Pronto para retirada no balcão");
      if (who.role !== "EMPLOYEE") return state;
      if (who.hasOverdue) return { ...state, action: { kind: "disabled", label: "Bloqueado por atraso", variant: "primary" } };
      if (who.openLoans >= who.loanLimit) {
        return { ...state, action: { kind: "disabled", label: `Limite de ${who.loanLimit} itens`, variant: "secondary" } };
      }
      return { ...state, action: { kind: "request", label: "Solicitar" } };
    }
  }
}

export type Filter = "all" | "available" | "loaned" | "maintenance";

export const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "available", label: "Disponíveis" },
  { id: "loaned", label: "Emprestados" },
  { id: "maintenance", label: "Em manutenção" },
];

const MATCHES: Record<Filter, (s: CatalogItem["situation"]) => boolean> = {
  all: () => true,
  available: (s) => s === "AVAILABLE",
  loaned: (s) => s === "LOANED" || s === "MINE",
  maintenance: (s) => s === "MAINTENANCE",
};

// LAYOUT §7.8–7.9: name + asset tag, case-insensitive; exclusive filters.
export function filterCatalog(items: CatalogItem[], query: string, filter: Filter): CatalogItem[] {
  const q = query.trim().toLocaleLowerCase("pt-BR");
  return items.filter(
    (i) =>
      MATCHES[filter](i.situation) &&
      (!q || i.name.toLocaleLowerCase("pt-BR").includes(q) || (i.assetTag ?? "").toLocaleLowerCase("pt-BR").includes(q)),
  );
}
