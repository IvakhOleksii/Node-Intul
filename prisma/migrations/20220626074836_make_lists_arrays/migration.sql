/*
  Warnings:

  - The `skillList` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `degreeList` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `certificationList` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "skillList",
ADD COLUMN     "skillList" TEXT[],
DROP COLUMN "degreeList",
ADD COLUMN     "degreeList" TEXT[],
DROP COLUMN "certificationList",
ADD COLUMN     "certificationList" TEXT[];
