/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Job_Unique_ExternalId" ON "Job"("externalId");
