-- AlterTable
ALTER TABLE "User" ADD COLUMN     "addressId" TEXT,
ADD COLUMN     "annualRevenue" BIGINT,
ADD COLUMN     "billingAddressId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
