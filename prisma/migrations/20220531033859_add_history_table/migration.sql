-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "table" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);
