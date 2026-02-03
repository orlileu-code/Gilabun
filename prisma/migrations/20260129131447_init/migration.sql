-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "preference" TEXT NOT NULL DEFAULT 'ANY',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "quotedWaitMin" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "zone" TEXT NOT NULL DEFAULT 'MAIN',
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "lastSeatedAt" DATETIME,
    "expectedFreeAt" DATETIME
);

-- CreateTable
CREATE TABLE "Seating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "seatedAt" DATETIME NOT NULL,
    "clearedAt" DATETIME,
    "durationMin" INTEGER,
    CONSTRAINT "Seating_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Seating_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Table_label_key" ON "Table"("label");
