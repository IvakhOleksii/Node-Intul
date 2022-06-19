-- AlterTable
ALTER TABLE "User" ADD COLUMN     "candidateId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
