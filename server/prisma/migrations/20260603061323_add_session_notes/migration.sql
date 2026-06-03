-- CreateTable
CREATE TABLE "SessionNote" (
    "id" TEXT NOT NULL,
    "classInstanceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SessionNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionNoteExercise" (
    "id" TEXT NOT NULL,
    "sessionNoteId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,

    CONSTRAINT "SessionNoteExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionNote_classInstanceId_idx" ON "SessionNote"("classInstanceId");

-- CreateIndex
CREATE INDEX "SessionNote_clientId_idx" ON "SessionNote"("clientId");

-- CreateIndex
CREATE INDEX "SessionNote_instructorId_idx" ON "SessionNote"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionNote_classInstanceId_clientId_key" ON "SessionNote"("classInstanceId", "clientId");

-- CreateIndex
CREATE INDEX "SessionNoteExercise_sessionNoteId_idx" ON "SessionNoteExercise"("sessionNoteId");

-- CreateIndex
CREATE INDEX "SessionNoteExercise_exerciseId_idx" ON "SessionNoteExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionNoteExercise_sessionNoteId_exerciseId_key" ON "SessionNoteExercise"("sessionNoteId", "exerciseId");

-- AddForeignKey
ALTER TABLE "SessionNote" ADD CONSTRAINT "SessionNote_classInstanceId_fkey" FOREIGN KEY ("classInstanceId") REFERENCES "ClassInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNote" ADD CONSTRAINT "SessionNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNote" ADD CONSTRAINT "SessionNote_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNoteExercise" ADD CONSTRAINT "SessionNoteExercise_sessionNoteId_fkey" FOREIGN KEY ("sessionNoteId") REFERENCES "SessionNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNoteExercise" ADD CONSTRAINT "SessionNoteExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
