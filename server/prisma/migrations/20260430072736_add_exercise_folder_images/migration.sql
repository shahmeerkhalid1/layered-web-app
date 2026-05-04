-- CreateTable
CREATE TABLE "ExerciseFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseImage" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExerciseImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseFolder_instructorId_idx" ON "ExerciseFolder"("instructorId");

-- CreateIndex
CREATE INDEX "ExerciseImage_exerciseId_idx" ON "ExerciseImage"("exerciseId");

-- AddForeignKey
ALTER TABLE "ExerciseFolder" ADD CONSTRAINT "ExerciseFolder_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ExerciseFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_progressionOfId_fkey" FOREIGN KEY ("progressionOfId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseImage" ADD CONSTRAINT "ExerciseImage_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
