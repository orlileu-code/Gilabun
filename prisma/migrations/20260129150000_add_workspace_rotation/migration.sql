-- Add TemplateTable.rotDeg, Workspace, WorkspaceTableState, Party.workspaceId, Seating.workspaceTableStateId (tableId nullable).

-- AlterTable TemplateTable: add rotation
ALTER TABLE "TemplateTable" ADD COLUMN "rotDeg" INTEGER NOT NULL DEFAULT 0;

-- CreateTable Workspace
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Workspace_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SeatingTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable WorkspaceTableState
CREATE TABLE "WorkspaceTableState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "lastSeatedAt" DATETIME,
    "expectedFreeAt" DATETIME,
    CONSTRAINT "WorkspaceTableState_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkspaceTableState_workspaceId_tableNumber_key" ON "WorkspaceTableState"("workspaceId", "tableNumber");

-- AlterTable Party: add workspaceId
ALTER TABLE "Party" ADD COLUMN "workspaceId" TEXT;

-- AlterTable Seating: add workspaceTableStateId, make tableId nullable (SQLite: recreate table)
PRAGMA foreign_keys=OFF;

CREATE TABLE "Seating_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "tableId" TEXT,
    "workspaceTableStateId" TEXT,
    "seatedAt" DATETIME NOT NULL,
    "clearedAt" DATETIME,
    "durationMin" INTEGER,
    CONSTRAINT "Seating_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Seating_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Seating_workspaceTableStateId_fkey" FOREIGN KEY ("workspaceTableStateId") REFERENCES "WorkspaceTableState" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "Seating_new" ("id", "partyId", "tableId", "seatedAt", "clearedAt", "durationMin")
SELECT "id", "partyId", "tableId", "seatedAt", "clearedAt", "durationMin" FROM "Seating";
DROP TABLE "Seating";
ALTER TABLE "Seating_new" RENAME TO "Seating";

PRAGMA foreign_keys=ON;
