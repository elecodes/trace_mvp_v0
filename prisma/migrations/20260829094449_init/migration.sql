-- CreateEnum
CREATE TYPE "LifecycleStage" AS ENUM ('DESIGN', 'PRODUCTION', 'SHOOTING', 'FINAL_DESTINATION');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('ORIGINAL', 'STOCK_LICENSED', 'AI_GENERATED', 'PUBLIC_DOMAIN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LegalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CircularityOutcome" AS ENUM ('REUSED', 'DONATED', 'RECYCLED', 'DISCARDED', 'PENDING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "currentStage" "LifecycleStage" NOT NULL DEFAULT 'DESIGN',
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_events" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "previousStage" "LifecycleStage",
    "newStage" "LifecycleStage" NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rights_records" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "licenseType" "LicenseType" NOT NULL,
    "sourceName" TEXT,
    "licenseDocUrl" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiToolName" TEXT,
    "legalStatus" "LegalStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rights_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sustainability_records" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "material" TEXT,
    "weightKg" DOUBLE PRECISION,
    "emissionFactor" DOUBLE PRECISION,
    "estimatedCo2eqKg" DOUBLE PRECISION,
    "circularityOutcome" "CircularityOutcome" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sustainability_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rights_records_assetId_key" ON "rights_records"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "sustainability_records_assetId_key" ON "sustainability_records"("assetId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifecycle_events" ADD CONSTRAINT "lifecycle_events_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rights_records" ADD CONSTRAINT "rights_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sustainability_records" ADD CONSTRAINT "sustainability_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
