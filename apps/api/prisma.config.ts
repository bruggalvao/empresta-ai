import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Per .env.example the API reads apps/api/.env; fall back to the repo-root .env
// (dotenv never overrides variables that are already set).
config();
config({ path: "../../.env" });

// Prisma 7: connection URLs live here, not in schema.prisma.
// Migrations use the direct connection (port 5432); runtime uses DATABASE_URL
// (pooler, port 6543) through a driver adapter in the app.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
