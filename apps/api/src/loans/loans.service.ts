import { Injectable } from "@nestjs/common";
import { type EquipmentCategory, Prisma } from "../generated/prisma/client.js";
import type { Membership } from "../auth/membership.js";
import { dateColumn, isoDate, saoPauloDates } from "../common/dates.js";
import { Problem } from "../common/problem.js";
import { PrismaService } from "../prisma/prisma.service.js";

export type CreatedLoan = { id: string; equipmentId: string; loanedAt: string; dueDate: string };

export type MyLoans = {
  loanLimit: number;
  loanPeriodDays: number;
  loans: {
    id: string;
    loanedAt: string;
    dueDate: string;
    overdue: boolean;
    equipment: { id: string; assetTag: string | null; name: string; category: EquipmentCategory; imagePath: string | null };
  }[];
};

export const REFUSALS = {
  employees_only: [403, "Só colaboradores solicitam empréstimo."],
  not_found: [404, "Equipamento não encontrado."],
  maintenance: [409, "Este equipamento está em manutenção e não pode ser emprestado."],
  already_loaned: [409, "Este equipamento já está emprestado."],
  overdue: [409, "Você tem empréstimo em atraso. Devolva o item atrasado antes de pegar outro."],
  loan_limit: [409, "Você já está com o máximo de itens permitido por pessoa."],
} as const satisfies Record<string, readonly [number, string]>;

const refuse = (reason: keyof typeof REFUSALS) => new Problem(REFUSALS[reason][0], reason, REFUSALS[reason][1]);

// Postgres unique_violation, surfaced by Prisma as P2002. The only unique
// index a loan insert can hit is loans_one_open_per_equipment.
const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  // PRD rules, checked inside one transaction (modelagem-dados.md, "Onde
  // cada regra é garantida"). Locking the person's membership row serializes
  // their requests, so the limit cannot be passed by parallel requests; two
  // requests for the same item are stopped by the partial unique index.
  async request(m: Membership, equipmentId: string): Promise<CreatedLoan> {
    if (m.role !== "EMPLOYEE") throw refuse("employees_only");
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT 1 FROM memberships WHERE tenant_id = ${m.tenantId}::uuid AND user_id = ${m.userId}::uuid FOR UPDATE`;

          const equipment = await tx.equipment.findFirst({
            where: { id: equipmentId, tenantId: m.tenantId },
            select: { status: true, loans: { where: { returnedAt: null }, take: 1, select: { id: true } } },
          });
          if (!equipment) throw refuse("not_found");
          if (equipment.status === "MAINTENANCE") throw refuse("maintenance");
          if (equipment.loans.length > 0) throw refuse("already_loaned");

          const { today, plus: due } = await saoPauloDates(tx, m.loanPeriodDays);
          const open = await tx.loan.findMany({
            where: { tenantId: m.tenantId, borrowerId: m.userId, returnedAt: null },
            select: { dueDate: true },
          });
          if (open.some((l) => isoDate(l.dueDate) < today)) throw refuse("overdue");
          if (open.length >= m.loanLimit) throw refuse("loan_limit");

          const loan = await tx.loan.create({
            data: { tenantId: m.tenantId, equipmentId, borrowerId: m.userId, dueDate: dateColumn(due) },
            select: { id: true, loanedAt: true },
          });
          await tx.auditLog.create({
            data: {
              tenantId: m.tenantId,
              actorId: m.userId,
              action: "loan.created",
              entityType: "loan",
              entityId: loan.id,
              metadata: { equipmentId, dueDate: due },
            },
          });
          return { id: loan.id, equipmentId, loanedAt: loan.loanedAt.toISOString(), dueDate: due };
        },
        { maxWait: 10_000, timeout: 20_000 },
      );
    } catch (e) {
      if (isUniqueViolation(e)) throw refuse("already_loaned");
      throw e;
    }
  }

  async mine(m: Membership): Promise<MyLoans> {
    const [rows, { today }] = await Promise.all([
      this.prisma.loan.findMany({
        where: { tenantId: m.tenantId, borrowerId: m.userId, returnedAt: null },
        orderBy: [{ dueDate: "asc" }, { loanedAt: "asc" }],
        select: {
          id: true,
          loanedAt: true,
          dueDate: true,
          equipment: { select: { id: true, assetTag: true, name: true, category: true, imagePath: true } },
        },
      }),
      saoPauloDates(this.prisma),
    ]);
    return {
      loanLimit: m.loanLimit,
      loanPeriodDays: m.loanPeriodDays,
      loans: rows.map(({ id, loanedAt, dueDate, equipment }) => {
        const due = isoDate(dueDate);
        return { id, loanedAt: loanedAt.toISOString(), dueDate: due, overdue: due < today, equipment };
      }),
    };
  }
}
