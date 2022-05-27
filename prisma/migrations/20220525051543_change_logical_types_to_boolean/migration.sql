/*
  Warnings:

  - The `idOnFile` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isAnonymized` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isDeleted` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isEditable` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isExempt` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paperWorkOnFile` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tobaccoUser` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `twoJobs` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `veteran` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `willRelocate` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `workAuthorized` column on the `Candidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `willRelocate` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `onSite` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `isDeleted` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `willRelocate` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `workAuthorized` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "idOnFile",
ADD COLUMN     "idOnFile" BOOLEAN,
DROP COLUMN "isAnonymized",
ADD COLUMN     "isAnonymized" BOOLEAN,
DROP COLUMN "isDeleted",
ADD COLUMN     "isDeleted" BOOLEAN,
DROP COLUMN "isEditable",
ADD COLUMN     "isEditable" BOOLEAN,
DROP COLUMN "isExempt",
ADD COLUMN     "isExempt" BOOLEAN,
DROP COLUMN "paperWorkOnFile",
ADD COLUMN     "paperWorkOnFile" BOOLEAN,
DROP COLUMN "tobaccoUser",
ADD COLUMN     "tobaccoUser" BOOLEAN,
DROP COLUMN "twoJobs",
ADD COLUMN     "twoJobs" BOOLEAN,
DROP COLUMN "veteran",
ADD COLUMN     "veteran" BOOLEAN,
DROP COLUMN "willRelocate",
ADD COLUMN     "willRelocate" BOOLEAN,
DROP COLUMN "workAuthorized",
ADD COLUMN     "workAuthorized" BOOLEAN;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "willRelocate",
ADD COLUMN     "willRelocate" BOOLEAN,
DROP COLUMN "onSite",
ADD COLUMN     "onSite" BOOLEAN,
DROP COLUMN "isDeleted",
ADD COLUMN     "isDeleted" BOOLEAN;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "willRelocate",
ADD COLUMN     "willRelocate" BOOLEAN,
DROP COLUMN "workAuthorized",
ADD COLUMN     "workAuthorized" BOOLEAN;
