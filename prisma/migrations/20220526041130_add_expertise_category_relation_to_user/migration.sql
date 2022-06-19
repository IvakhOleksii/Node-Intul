/*
  Warnings:

  - You are about to drop the column `expertise` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "expertise",
ADD COLUMN     "expertiseId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_expertiseId_fkey" FOREIGN KEY ("expertiseId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
