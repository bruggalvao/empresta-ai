// API contract (specs login and solicitar-emprestimo, plan "Contrato de
// API"). Hand-written until packages/api-contract exists.
export type Role = "EMPLOYEE" | "OPERATIONS";
export type Category = "NOTEBOOK" | "MONITOR" | "CABLE" | "CAMERA" | "ACCESSORY";
export type Situation = "AVAILABLE" | "MAINTENANCE" | "LOANED" | "MINE";

export type Me = {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  tenant: { slug: string; name: string };
};

export type CatalogItem = {
  id: string;
  assetTag: string | null;
  name: string;
  category: Category;
  imagePath: string | null;
  notes: string | null;
  situation: Situation;
  /** Only when situation is MINE. */
  dueDate?: string;
  overdue?: boolean;
};

export type MyLoan = {
  id: string;
  loanedAt: string;
  dueDate: string;
  overdue: boolean;
  equipment: { id: string; assetTag: string | null; name: string; category: Category; imagePath: string | null };
};

export type MyLoans = { loanLimit: number; loanPeriodDays: number; loans: MyLoan[] };

export type CreatedLoan = { id: string; equipmentId: string; loanedAt: string; dueDate: string };

export interface Api {
  me(token: string): Promise<Me>;
  equipment(token: string): Promise<{ items: CatalogItem[] }>;
  myLoans(token: string): Promise<MyLoans>;
  requestLoan(token: string, equipmentId: string): Promise<CreatedLoan>;
}

export class ApiError extends Error {
  readonly status: number;
  /** Machine-readable refusal reason (Problem Details extension member). */
  readonly reason: string | undefined;
  constructor(status: number, message: string, reason?: string) {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}
