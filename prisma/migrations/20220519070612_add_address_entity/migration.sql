-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "timezone" TEXT,
    "countryCode" INTEGER NOT NULL,
    "countryName" TEXT NOT NULL,
    "countryID" INTEGER NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);
