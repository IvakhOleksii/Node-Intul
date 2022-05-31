/*
  Warnings:

  - You are about to drop the column `new_value` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `old_value` on the `History` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "History" DROP COLUMN "new_value",
DROP COLUMN "old_value",
ADD COLUMN     "newValue" TEXT,
ADD COLUMN     "oldValue" TEXT;
