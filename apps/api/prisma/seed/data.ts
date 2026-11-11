// Seed input: the practice's equipment list and the photo credits, both from
// packages/equipment-images (single source for "dados iguais para todos").
// Everything is validated here, before the seed writes anything (CA-7).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TENANT = { slug: "suporte_ti", name: "Suporte TI" } as const;
export const PROFESSOR = {
  email: "marcelo.grilo@institutojef.org.br",
  fullName: "Marcelo Grilo",
} as const;
export const PASSWORD_ENV = "PROFESSOR_INITIAL_PASSWORD";

const IMAGES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../packages/equipment-images",
);
export const EQUIPMENT_FILE = path.join(IMAGES_DIR, "equipamentos.json");
export const CREDITS_FILE = path.join(IMAGES_DIR, "creditos.json");

export type Category = "NOTEBOOK" | "MONITOR" | "CABLE" | "CAMERA";
export type Status = "AVAILABLE" | "MAINTENANCE";

const CATEGORY: Record<string, Category> = {
  notebook: "NOTEBOOK",
  monitor: "MONITOR",
  cabo: "CABLE",
  camera: "CAMERA",
};
const STATUS: Record<string, Status> = {
  disponivel: "AVAILABLE",
  manutencao: "MAINTENANCE",
};
// Same rule as the DB CHECK and apps/web/src/lib/equipment-photo/storage.ts.
const IMAGE_PATH = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i;

export type ListItem = { patrimonio: string; nome: string; categoria: string; situacao: string };
export type Credit = { patrimonio: string; arquivo: string };

export type EquipmentSeed = {
  assetTag: string;
  name: string;
  category: Category;
  status: Status;
  imagePath: string;
};

export type SeedInput = {
  tenant: typeof TENANT;
  professor: { email: string; fullName: string; password: string };
  equipment: EquipmentSeed[];
};

export class SeedInputError extends Error {
  constructor(readonly problems: string[]) {
    super(`seed não executado, nada foi gravado:\n- ${problems.join("\n- ")}`);
    this.name = "SeedInputError";
  }
}

export function buildSeedInput(args: {
  list: ListItem[];
  credits: Credit[];
  password: string | undefined;
}): SeedInput {
  const problems: string[] = [];
  const password = args.password?.trim() ? args.password : undefined;
  if (!password) problems.push(`${PASSWORD_ENV} ausente ou vazia em apps/api/.env (ver .env.example)`);

  const credits = new Map(args.credits.map((c) => [c.patrimonio, c]));
  const seen = new Set<string>();
  const equipment: EquipmentSeed[] = [];

  if (args.list.length === 0) problems.push("lista de equipamentos vazia");
  for (const item of args.list) {
    if (seen.has(item.patrimonio)) problems.push(`${item.patrimonio}: patrimônio repetido na lista`);
    seen.add(item.patrimonio);
    const category = CATEGORY[item.categoria];
    const status = STATUS[item.situacao];
    const credit = credits.get(item.patrimonio);
    if (!category) problems.push(`${item.patrimonio}: categoria desconhecida "${item.categoria}"`);
    if (!status) problems.push(`${item.patrimonio}: situação desconhecida "${item.situacao}"`);
    if (!credit) {
      problems.push(`${item.patrimonio}: sem foto em creditos.json (rode a skill imagens-equipamentos)`);
    } else if (!IMAGE_PATH.test(credit.arquivo) || credit.arquivo.includes("..")) {
      problems.push(`${item.patrimonio}: arquivo de foto inválido "${credit.arquivo}"`);
    }
    if (category && status && credit) {
      equipment.push({
        assetTag: item.patrimonio,
        name: item.nome,
        category,
        status,
        imagePath: credit.arquivo,
      });
    }
  }

  if (problems.length) throw new SeedInputError(problems);
  return {
    tenant: TENANT,
    professor: { ...PROFESSOR, password: password as string },
    equipment,
  };
}

export async function loadSeedInput(env: NodeJS.ProcessEnv = process.env): Promise<SeedInput> {
  const [list, credits] = await Promise.all([
    readFile(EQUIPMENT_FILE, "utf8").then((t) => JSON.parse(t) as ListItem[]),
    readFile(CREDITS_FILE, "utf8").then((t) => JSON.parse(t) as Credit[]),
  ]);
  return buildSeedInput({ list, credits, password: env[PASSWORD_ENV] });
}
