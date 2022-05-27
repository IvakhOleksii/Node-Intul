/*
  Warnings:

  - You are about to alter the column `annualRevenue` on the `Company` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "annualRevenue" SET DATA TYPE INTEGER;
