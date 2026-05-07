-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "chainType" TEXT,
ADD COLUMN     "directionFaced" TEXT,
ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "jointLoading" TEXT,
ADD COLUMN     "machineSetup" TEXT,
ADD COLUMN     "movementType" TEXT,
ADD COLUMN     "orientation" TEXT,
ADD COLUMN     "spinalMovement" TEXT,
ADD COLUMN     "springs" TEXT,
ADD COLUMN     "startingPosition" TEXT,
ADD COLUMN     "transitionCues" TEXT;

-- CreateTable
CREATE TABLE "ExerciseLayer" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseLayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropdownCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DropdownCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropdownOption" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "instructorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DropdownOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseLayer_exerciseId_idx" ON "ExerciseLayer"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "DropdownCategory_key_key" ON "DropdownCategory"("key");

-- CreateIndex
CREATE INDEX "DropdownOption_categoryId_idx" ON "DropdownOption"("categoryId");

-- CreateIndex
CREATE INDEX "DropdownOption_instructorId_idx" ON "DropdownOption"("instructorId");

-- AddForeignKey
ALTER TABLE "ExerciseLayer" ADD CONSTRAINT "ExerciseLayer_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropdownOption" ADD CONSTRAINT "DropdownOption_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DropdownCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropdownOption" ADD CONSTRAINT "DropdownOption_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
