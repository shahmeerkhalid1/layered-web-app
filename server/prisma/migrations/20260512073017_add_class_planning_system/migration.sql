-- AlterTable
ALTER TABLE "ClassPlanTemplate" ADD COLUMN     "classStyle" TEXT,
ADD COLUMN     "classType" TEXT,
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "folderId" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "savedToLibrary" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ClassPlanFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClassPlanFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT,
    "classInstanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSectionExercise" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "reps" TEXT,
    "duration" TEXT,
    "notes" TEXT,

    CONSTRAINT "PlanSectionExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassPlanFolder_instructorId_idx" ON "ClassPlanFolder"("instructorId");

-- CreateIndex
CREATE INDEX "PlanSection_templateId_idx" ON "PlanSection"("templateId");

-- CreateIndex
CREATE INDEX "PlanSection_classInstanceId_idx" ON "PlanSection"("classInstanceId");

-- CreateIndex
CREATE INDEX "PlanSectionExercise_sectionId_idx" ON "PlanSectionExercise"("sectionId");

-- CreateIndex
CREATE INDEX "PlanSectionExercise_exerciseId_idx" ON "PlanSectionExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "ClassPlanTemplate_folderId_idx" ON "ClassPlanTemplate"("folderId");

-- AddForeignKey
ALTER TABLE "ClassPlanFolder" ADD CONSTRAINT "ClassPlanFolder_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassPlanTemplate" ADD CONSTRAINT "ClassPlanTemplate_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassPlanTemplate" ADD CONSTRAINT "ClassPlanTemplate_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ClassPlanFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSection" ADD CONSTRAINT "PlanSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ClassPlanTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSectionExercise" ADD CONSTRAINT "PlanSectionExercise_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "PlanSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSectionExercise" ADD CONSTRAINT "PlanSectionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
