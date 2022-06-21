/*
  Warnings:

  - You are about to drop the column `expertiseId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_expertiseId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "expertiseId",
ADD COLUMN     "categoryId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
