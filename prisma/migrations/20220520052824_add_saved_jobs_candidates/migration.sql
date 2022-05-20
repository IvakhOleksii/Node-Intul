-- CreateTable
CREATE TABLE "_userSavedJobs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_userSavedCandidates" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_userSavedJobs_AB_unique" ON "_userSavedJobs"("A", "B");

-- CreateIndex
CREATE INDEX "_userSavedJobs_B_index" ON "_userSavedJobs"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_userSavedCandidates_AB_unique" ON "_userSavedCandidates"("A", "B");

-- CreateIndex
CREATE INDEX "_userSavedCandidates_B_index" ON "_userSavedCandidates"("B");

-- AddForeignKey
ALTER TABLE "_userSavedJobs" ADD CONSTRAINT "_userSavedJobs_A_fkey" FOREIGN KEY ("A") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userSavedJobs" ADD CONSTRAINT "_userSavedJobs_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userSavedCandidates" ADD CONSTRAINT "_userSavedCandidates_A_fkey" FOREIGN KEY ("A") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userSavedCandidates" ADD CONSTRAINT "_userSavedCandidates_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
