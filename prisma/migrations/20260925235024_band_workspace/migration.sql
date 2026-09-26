-- CreateTable
CREATE TABLE "Band" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoData" TEXT,
    "genre" TEXT,
    "city" TEXT,
    "foundedYear" INTEGER,
    "bio" TEXT,
    "hasStore" BOOLEAN NOT NULL DEFAULT false,
    "storeUrl" TEXT,
    "links" JSONB,
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Band_pkey" PRIMARY KEY ("id")
);
