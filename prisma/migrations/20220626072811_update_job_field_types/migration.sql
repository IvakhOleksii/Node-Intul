/*
  Warnings:

  - The `yearsRequired` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "yearsRequired",
ADD COLUMN     "yearsRequired" INTEGER,
DROP COLUMN "type",
ADD COLUMN     "type" INTEGER;
