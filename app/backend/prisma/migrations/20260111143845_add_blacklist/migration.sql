/*
  Warnings:

  - You are about to drop the `_UserBlocked` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_UserBlocked";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Block" (
    "blockerId" INTEGER NOT NULL,
    "blockedId" INTEGER NOT NULL,

    PRIMARY KEY ("blockerId", "blockedId"),
    CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
