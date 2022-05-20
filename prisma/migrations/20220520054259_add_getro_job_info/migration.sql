/*
  Warnings:

  - Made the column `hidden` on table `Job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "getroJobInfoId" TEXT,
ALTER COLUMN "hidden" SET NOT NULL,
ALTER COLUMN "hidden" SET DEFAULT false;

-- CreateTable
CREATE TABLE "GetroJobInfo" (
    "id" TEXT NOT NULL,
    "applcation_method" TEXT,
    "application_path" TEXT,
    "compensation_currency" TEXT,
    "compensation_max" TEXT,
    "compensation_min" TEXT,
    "compensation_period" TEXT,
    "compensation_public" TEXT,
    "description" TEXT,
    "discarded" TEXT,
    "employment_types" TEXT,
    "expires_at" TIMESTAMP(3),
    "job_functions" TEXT,
    "liked" TEXT,
    "locations" TEXT,
    "organization_domain" TEXT,
    "organization_id" TEXT,
    "organization_logo_url" TEXT,
    "organization_name" TEXT,
    "organization_slug" TEXT,
    "passes_filter" TEXT,
    "posted_at" TIMESTAMP(3),
    "slug" TEXT,
    "source" TEXT,
    "status" TEXT,
    "title" TEXT,
    "url" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GetroJobInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_getroJobInfoId_fkey" FOREIGN KEY ("getroJobInfoId") REFERENCES "GetroJobInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
