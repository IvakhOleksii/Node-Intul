/*
  Warnings:

  - Added the required column `datasource` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Datasource" AS ENUM ('main', 'bullhorn', 'getro');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "datasource" "Datasource" NOT NULL;
