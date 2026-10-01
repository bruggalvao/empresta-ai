-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "membership_role" AS ENUM ('EMPLOYEE', 'OPERATIONS');

-- CreateEnum
CREATE TYPE "equipment_category" AS ENUM ('NOTEBOOK', 'MONITOR', 'CABLE', 'CAMERA', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "equipment_status" AS ENUM ('AVAILABLE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "loan_limit" INTEGER NOT NULL DEFAULT 3,
    "loan_period_days" INTEGER NOT NULL DEFAULT 14,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "membership_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "equipment_category" NOT NULL,
    "asset_tag" TEXT,
    "status" "equipment_status" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "borrower_id" UUID NOT NULL,
    "loaned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE NOT NULL,
    "returned_at" TIMESTAMPTZ(6),
    "returned_by_id" UUID,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_tenant_id_user_id_key" ON "memberships"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "equipment_tenant_id_status_idx" ON "equipment"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_id_tenant_id_key" ON "equipment"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_asset_tag_key" ON "equipment"("tenant_id", "asset_tag");

-- CreateIndex
CREATE INDEX "loans_tenant_id_borrower_id_idx" ON "loans"("tenant_id", "borrower_id");

-- CreateIndex
CREATE INDEX "loans_equipment_id_idx" ON "loans"("equipment_id");

-- CreateIndex
CREATE INDEX "loans_tenant_id_due_date_idx" ON "loans"("tenant_id", "due_date");

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_created_at_idx" ON "audit_log"("tenant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_equipment_id_tenant_id_fkey" FOREIGN KEY ("equipment_id", "tenant_id") REFERENCES "equipment"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_borrower_id_fkey" FOREIGN KEY ("tenant_id", "borrower_id") REFERENCES "memberships"("tenant_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_by_id_fkey" FOREIGN KEY ("returned_by_id") REFERENCES "profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ============================================================================
-- Raw SQL: objects Prisma cannot model. Keep in this migration so they share the
-- versioned timeline (ADR 001 §2.5).
-- ============================================================================

-- Data integrity ---------------------------------------------------------------

ALTER TABLE "tenants"
  ADD CONSTRAINT "tenants_loan_limit_positive" CHECK ("loan_limit" > 0),
  ADD CONSTRAINT "tenants_loan_period_positive" CHECK ("loan_period_days" > 0);

ALTER TABLE "equipment"
  ADD CONSTRAINT "equipment_name_not_blank" CHECK (length(btrim("name")) > 0);

ALTER TABLE "loans"
  ADD CONSTRAINT "loans_return_after_loan" CHECK ("returned_at" IS NULL OR "returned_at" >= "loaned_at");

-- At most one open loan per piece of equipment. This is what makes "solicitar" safe
-- under concurrency: the second concurrent INSERT fails with a unique violation.
CREATE UNIQUE INDEX "loans_one_open_per_equipment"
  ON "loans" ("equipment_id") WHERE "returned_at" IS NULL;

-- Hot path: open loans of a person (limit of 3, overdue block, "Meus empréstimos").
CREATE INDEX "loans_open_by_borrower"
  ON "loans" ("tenant_id", "borrower_id") WHERE "returned_at" IS NULL;

-- Identity -----------------------------------------------------------------------

-- profiles.user_id mirrors auth.users.id. Added conditionally because the auth schema
-- only exists on Supabase, not in Prisma's shadow database or a plain local Postgres.
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    ALTER TABLE "profiles"
      ADD CONSTRAINT "profiles_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES auth.users ("id") ON DELETE CASCADE;
  END IF;
END
$$;

-- Audit log: append-only -----------------------------------------------------------

CREATE FUNCTION "audit_log_reject_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (% rejected)', TG_OP;
END
$$;

CREATE TRIGGER "audit_log_no_update_delete"
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION "audit_log_reject_mutation"();

CREATE TRIGGER "audit_log_no_truncate"
  BEFORE TRUNCATE ON "audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit_log_reject_mutation"();

-- Row Level Security: deny by default ------------------------------------------------
-- RLS is defense in depth (ADR 001 §2.7). With RLS on and NO policies, the Supabase
-- roles `anon` and `authenticated` see nothing. The API connects as the table owner,
-- which bypasses RLS, and enforces authorization with Nest guards + CASL.
-- Do not add permissive policies without a decision recorded in an ADR.

ALTER TABLE "tenants"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipment"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loans"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;

-- Belt and braces: the Data API roles get no table privileges either.
DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
    END IF;
  END LOOP;
END
$$;
