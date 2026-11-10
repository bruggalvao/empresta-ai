// Test-only: a real Postgres (Testcontainers) with this repository's
// migrations applied, as ADR 001 §2.8 asks for integration tests.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../prisma/migrations");

export async function startDatabase(): Promise<StartedPostgreSqlContainer> {
  const container = await new PostgreSqlContainer("postgres:17-alpine").start();
  const client = new pg.Client({ connectionString: container.getConnectionUri() });
  await client.connect();
  try {
    const dirs = (await readdir(MIGRATIONS_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const dir of dirs) await client.query(await readFile(path.join(MIGRATIONS_DIR, dir, "migration.sql"), "utf8"));
  } finally {
    await client.end();
  }
  return container;
}
