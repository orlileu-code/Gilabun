-- Add required Table.number (restaurant table 1..20). Backfill existing rows with sequential numbers.

-- SQLite: add NOT NULL column by recreating table (preserves FKs after rename)
PRAGMA foreign_keys=OFF;

CREATE TABLE "Table_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "zone" TEXT NOT NULL DEFAULT 'MAIN',
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "lastSeatedAt" DATETIME,
    "expectedFreeAt" DATETIME
);

-- Backfill: assign sequential number by rowid order
INSERT INTO "Table_new" ("id", "label", "number", "capacity", "zone", "status", "lastSeatedAt", "expectedFreeAt")
SELECT "id", "label",
    (SELECT COUNT(*) FROM "Table" t2 WHERE t2.rowid <= "Table".rowid),
    "capacity", "zone", "status", "lastSeatedAt", "expectedFreeAt"
FROM "Table";

DROP TABLE "Table";

ALTER TABLE "Table_new" RENAME TO "Table";

CREATE UNIQUE INDEX "Table_label_key" ON "Table"("label");
CREATE UNIQUE INDEX "Table_number_key" ON "Table"("number");

PRAGMA foreign_keys=ON;
