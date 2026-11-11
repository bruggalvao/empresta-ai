// spec solicitar-emprestimo, CA-7, CA-8 and CA-10: the button and pill of
// each item, derived from the item and from who is looking.
import { describe, expect, it } from "vitest";
import type { CatalogItem } from "./api/types";
import { type Borrower, cardState } from "./loanRules";

const base: CatalogItem = { id: "x", assetTag: "TI-0001", name: "Item", category: "NOTEBOOK", imagePath: null, notes: null, situation: "AVAILABLE" };
const employee: Borrower = { role: "EMPLOYEE", openLoans: 0, loanLimit: 3, hasOverdue: false };

describe("cardState", () => {
  it.each([
    ["disponível", { situation: "AVAILABLE" }, employee, "available", { kind: "request", label: "Solicitar" }],
    ["manutenção", { situation: "MAINTENANCE" }, employee, "maintenance", { kind: "disabled", label: "Indisponível", variant: "primary" }],
    ["de outra pessoa", { situation: "LOANED" }, employee, "loaned", { kind: "disabled", label: "Emprestado", variant: "primary" }],
    ["comigo", { situation: "MINE", dueDate: "2026-11-24", overdue: false }, employee, "loaned", { kind: "disabled", label: "Está com você", variant: "primary" }],
    ["comigo em atraso", { situation: "MINE", dueDate: "2026-11-01", overdue: true }, employee, "late", { kind: "disabled", label: "Está com você", variant: "primary" }],
    ["no limite", { situation: "AVAILABLE" }, { ...employee, openLoans: 3 }, "available", { kind: "disabled", label: "Limite de 3 itens", variant: "secondary" }],
    ["com atraso", { situation: "AVAILABLE" }, { ...employee, openLoans: 1, hasOverdue: true }, "available", { kind: "disabled", label: "Bloqueado por atraso", variant: "primary" }],
    ["atraso vale antes do limite", { situation: "AVAILABLE" }, { ...employee, openLoans: 3, hasOverdue: true }, "available", { kind: "disabled", label: "Bloqueado por atraso", variant: "primary" }],
    ["Operações", { situation: "AVAILABLE" }, { ...employee, role: "OPERATIONS" }, "available", { kind: "none" }],
    ["Operações, manutenção", { situation: "MAINTENANCE" }, { ...employee, role: "OPERATIONS" }, "maintenance", { kind: "none" }],
  ] as const)("CA-8: %s", (_, item, who, pill, action) => {
    const state = cardState({ ...base, ...item }, who);
    expect(state.pill).toBe(pill);
    expect(state.action).toEqual(action);
  });

  it("CA-7: detalhe por situação; manutenção mostra a observação; item de outra pessoa não mostra prazo", () => {
    expect(cardState(base, employee).detail).toBe("Pronto para retirada no balcão");
    expect(cardState({ ...base, situation: "MAINTENANCE", notes: "Tela trincada" }, employee).detail).toBe("Tela trincada");
    expect(cardState({ ...base, situation: "MAINTENANCE" }, employee).detail).toBe("Em manutenção, sem previsão de retorno");
    expect(cardState({ ...base, situation: "MINE", dueDate: "2026-11-24" }, employee).detail).toBe("Com você · devolver até 24/11/2026");
    expect(cardState({ ...base, situation: "LOANED" }, employee).detail).toBe("Emprestado no momento");
  });
});
