-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "image_path" TEXT;

-- Raw SQL (Prisma cannot model CHECK constraints).
-- Object path in the public "equipamentos" bucket: a plain file name with an
-- image extension, the same rule as apps/web/src/lib/equipment-photo/storage.ts.
-- Existing rows get NULL (no photo). No new table: the existing deny_all RLS
-- policy on "equipment" still applies.
ALTER TABLE "equipment"
  ADD CONSTRAINT "equipment_image_path_format"
  CHECK ("image_path" IS NULL
         OR ("image_path" ~* '^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp)$'
             AND position('..' in "image_path") = 0));
