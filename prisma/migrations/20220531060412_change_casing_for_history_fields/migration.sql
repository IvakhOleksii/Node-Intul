/*
  Warnings:

  - You are about to drop the column `batch_id` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `record_id` on the `History` table. All the data in the column will be lost.
  - Added the required column `recordId` to the `History` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "History" DROP COLUMN "batch_id",
DROP COLUMN "record_id",
ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "recordId" TEXT NOT NULL;
