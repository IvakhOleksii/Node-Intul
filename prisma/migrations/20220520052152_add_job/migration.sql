-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "description" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country_id" TEXT,
    "employmentType" TEXT,
    "title" TEXT,
    "willRelocate" TEXT,
    "yearsRequired" TEXT,
    "status" TEXT,
    "skillList" TEXT,
    "locations" TEXT,
    "companyId" TEXT,
    "interviews" TEXT,
    "onSite" TEXT,
    "salary" TEXT,
    "salaryUnit" TEXT,
    "startDate" TIMESTAMP(3),
    "type" TEXT,
    "isDeleted" TEXT,
    "postedAt" TIMESTAMP(3),
    "hidden" BOOLEAN,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
