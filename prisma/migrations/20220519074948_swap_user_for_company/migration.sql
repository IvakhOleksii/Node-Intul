/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_addressId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_billingAddressId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_branchId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_departmentId_fkey";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "annualRevenue" BIGINT,
    "addressId" TEXT,
    "billingAddressId" TEXT,
    "billingContact" TEXT,
    "billingFrequency" TEXT,
    "billingPhone" TEXT,
    "branchId" TEXT,
    "businessSectorList" TEXT[],
    "companyDescription" TEXT,
    "companyURL" TEXT,
    "competitors" TEXT[],
    "culture" TEXT,
    "dateAdded" TIMESTAMP(3),
    "dateFounded" TIMESTAMP(3),
    "dateLastModified" TIMESTAMP(3),
    "departmentId" TEXT,
    "externalID" TEXT,
    "facebookProfileName" TEXT,
    "fax" TEXT,
    "feeArrangement" DOUBLE PRECISION,
    "funding" TEXT,
    "industryList" TEXT[],
    "invoiceFormat" TEXT,
    "linkedinProfileName" TEXT,
    "notes" TEXT,
    "numEmployees" INTEGER,
    "numOffices" INTEGER,
    "ownership" TEXT,
    "phone" TEXT,
    "revuenue" TEXT,
    "status" TEXT,
    "taxRate" DOUBLE PRECISION,
    "tickerSymbol" TEXT,
    "trackTitle" TEXT,
    "twitterHandle" TEXT,
    "workWeekStart" INTEGER,
    "_score" DOUBLE PRECISION,
    "customDate1" TIMESTAMP(3),
    "customDate2" TIMESTAMP(3),
    "customDate3" TIMESTAMP(3),
    "customFloat1" DOUBLE PRECISION,
    "customFloat2" DOUBLE PRECISION,
    "customFloat3" DOUBLE PRECISION,
    "customInt1" INTEGER,
    "customInt2" INTEGER,
    "customInt3" INTEGER,
    "customText1" TEXT,
    "customText2" TEXT,
    "customText3" TEXT,
    "customText4" TEXT,
    "customText5" TEXT,
    "customText6" TEXT,
    "customText7" TEXT,
    "customText8" TEXT,
    "customText9" TEXT,
    "customText10" TEXT,
    "customText11" TEXT,
    "customText12" TEXT,
    "customText13" TEXT,
    "customText14" TEXT,
    "customText15" TEXT,
    "customText16" TEXT,
    "customText17" TEXT,
    "customText18" TEXT,
    "customText19" TEXT,
    "customText20" TEXT,
    "customTextBlock1" TEXT,
    "customTextBlock2" TEXT,
    "customTextBlock3" TEXT,
    "customTextBlock4" TEXT,
    "customTextBlock5" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
