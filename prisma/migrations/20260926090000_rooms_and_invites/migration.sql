-- Salas (multi-banda) con código de invitación.
-- Los datos existentes pasan a la sala más antigua; si todavía no había
-- ninguna banda configurada pero sí datos, se crea una sala "Mi banda"
-- que el administrador completará en el asistente.

-- Código de invitación para las bandas existentes
ALTER TABLE "Band" ADD COLUMN "inviteCode" TEXT;
UPDATE "Band"
SET "inviteCode" = upper(substr(md5(random()::text || "id"), 1, 4)) || '-' || upper(substr(md5(random()::text), 1, 4))
WHERE "inviteCode" IS NULL;

INSERT INTO "Band" ("id", "name", "inviteCode", "hasStore", "createdAt", "updatedAt")
SELECT 'c' || substr(md5(random()::text), 1, 24),
       'Mi banda',
       upper(substr(md5(random()::text), 1, 4)) || '-' || upper(substr(md5(random()::text), 1, 4)),
       true,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Band")
  AND EXISTS (SELECT 1 FROM "User");

ALTER TABLE "Band" ALTER COLUMN "inviteCode" SET NOT NULL;

-- bandId en las entidades raíz, rellenado con la sala existente
ALTER TABLE "Event" ADD COLUMN "bandId" TEXT;
UPDATE "Event" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "Event" ALTER COLUMN "bandId" SET NOT NULL;

ALTER TABLE "FileAsset" ADD COLUMN "bandId" TEXT;
UPDATE "FileAsset" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "FileAsset" ALTER COLUMN "bandId" SET NOT NULL;

ALTER TABLE "Order" ADD COLUMN "bandId" TEXT;
UPDATE "Order" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "bandId" SET NOT NULL;

ALTER TABLE "Product" ADD COLUMN "bandId" TEXT;
UPDATE "Product" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "Product" ALTER COLUMN "bandId" SET NOT NULL;

ALTER TABLE "Repertoire" ADD COLUMN "bandId" TEXT;
UPDATE "Repertoire" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "Repertoire" ALTER COLUMN "bandId" SET NOT NULL;

ALTER TABLE "Setlist" ADD COLUMN "bandId" TEXT;
UPDATE "Setlist" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "Setlist" ALTER COLUMN "bandId" SET NOT NULL;

ALTER TABLE "Song" ADD COLUMN "bandId" TEXT;
UPDATE "Song" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "Song" ALTER COLUMN "bandId" SET NOT NULL;

ALTER TABLE "SyncLog" ADD COLUMN "bandId" TEXT;
UPDATE "SyncLog" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "SyncLog" ALTER COLUMN "bandId" SET NOT NULL;

ALTER TABLE "Task" ADD COLUMN "bandId" TEXT;
UPDATE "Task" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "Task" ALTER COLUMN "bandId" SET NOT NULL;

ALTER TABLE "User" ADD COLUMN "bandId" TEXT;
UPDATE "User" SET "bandId" = (SELECT "id" FROM "Band" ORDER BY "createdAt" ASC LIMIT 1) WHERE "bandId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "bandId" SET NOT NULL;

-- Unicidad por sala (SKU y nº de pedido) e índices
-- DropIndex
DROP INDEX "Order_orderNumber_key";

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "ProductVariant_sku_key";

-- CreateIndex
CREATE UNIQUE INDEX "Band_inviteCode_key" ON "Band"("inviteCode");

-- CreateIndex
CREATE INDEX "Event_bandId_idx" ON "Event"("bandId");

-- CreateIndex
CREATE INDEX "FileAsset_bandId_idx" ON "FileAsset"("bandId");

-- CreateIndex
CREATE INDEX "Order_bandId_idx" ON "Order"("bandId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_bandId_orderNumber_key" ON "Order"("bandId", "orderNumber");

-- CreateIndex
CREATE INDEX "Product_bandId_idx" ON "Product"("bandId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_bandId_sku_key" ON "Product"("bandId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_sku_key" ON "ProductVariant"("productId", "sku");

-- CreateIndex
CREATE INDEX "Repertoire_bandId_idx" ON "Repertoire"("bandId");

-- CreateIndex
CREATE INDEX "Setlist_bandId_idx" ON "Setlist"("bandId");

-- CreateIndex
CREATE INDEX "Song_bandId_idx" ON "Song"("bandId");

-- CreateIndex
CREATE INDEX "SyncLog_bandId_idx" ON "SyncLog"("bandId");

-- CreateIndex
CREATE INDEX "Task_bandId_idx" ON "Task"("bandId");

-- CreateIndex
CREATE INDEX "User_bandId_idx" ON "User"("bandId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repertoire" ADD CONSTRAINT "Repertoire_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setlist" ADD CONSTRAINT "Setlist_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

