/*
  Warnings:

  - You are about to alter the column `isActive` on the `Workspace` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Party" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "preference" TEXT NOT NULL DEFAULT 'ANY',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "quotedWaitMin" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seatedAt" DATETIME,
    "workspaceId" TEXT,
    CONSTRAINT "Party_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Party" ("createdAt", "id", "name", "notes", "phone", "preference", "quotedWaitMin", "seatedAt", "size", "status", "workspaceId") SELECT "createdAt", "id", "name", "notes", "phone", "preference", "quotedWaitMin", "seatedAt", "size", "status", "workspaceId" FROM "Party";
DROP TABLE "Party";
ALTER TABLE "new_Party" RENAME TO "Party";
CREATE TABLE "new_Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Workspace_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SeatingTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Workspace" ("createdAt", "id", "isActive", "name", "templateId") SELECT "createdAt", "id", "isActive", "name", "templateId" FROM "Workspace";
DROP TABLE "Workspace";
ALTER TABLE "new_Workspace" RENAME TO "Workspace";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
