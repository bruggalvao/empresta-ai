import { Injectable } from "@nestjs/common";
import type { EquipmentCategory } from "../generated/prisma/client.js";
import type { Membership } from "../auth/membership.js";
import { isoDate, saoPauloDates } from "../common/dates.js";
import { PrismaService } from "../prisma/prisma.service.js";

export type Situation = "AVAILABLE" | "MAINTENANCE" | "LOANED" | "MINE";

export type CatalogItem = {
  id: string;
  assetTag: string | null;
  name: string;
  category: EquipmentCategory;
  imagePath: string | null;
  notes: string | null;
  situation: Situation;
  /** Only for the person's own loan (spec solicitar-emprestimo, CA-1). */
  dueDate?: string;
  overdue?: boolean;
};

// Situation is derived, not stored (modelagem-dados.md): an open loan makes
// the item LOANED, or MINE when it is the caller's. Someone else's loan is
// reported without borrower, id or due date (PRD item 1).
@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async catalog(m: Membership): Promise<{ items: CatalogItem[] }> {
    const [rows, { today }] = await Promise.all([
      this.prisma.equipment.findMany({
        where: { tenantId: m.tenantId },
        orderBy: { assetTag: "asc" },
        select: {
          id: true,
          assetTag: true,
          name: true,
          category: true,
          imagePath: true,
          notes: true,
          status: true,
          loans: { where: { returnedAt: null }, take: 1, select: { borrowerId: true, dueDate: true } },
        },
      }),
      saoPauloDates(this.prisma),
    ]);

    const items = rows.map(({ loans, status, ...base }): CatalogItem => {
      const open = loans[0];
      if (open && open.borrowerId === m.userId) {
        const dueDate = isoDate(open.dueDate);
        return { ...base, situation: "MINE", dueDate, overdue: dueDate < today };
      }
      if (open) return { ...base, situation: "LOANED" };
      return { ...base, situation: status === "MAINTENANCE" ? "MAINTENANCE" : "AVAILABLE" };
    });
    return { items };
  }
}
