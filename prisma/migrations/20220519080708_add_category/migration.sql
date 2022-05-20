-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dateAdded" TIMESTAMP(3),
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "externalID" INTEGER,
    "occupation" TEXT,
    "type" TEXT,
    "_score" DOUBLE PRECISION,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
