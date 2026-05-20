-- CreateTable
CREATE TABLE "ClassInstance" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TIMESTAMPTZ NOT NULL,
    "status" "InstanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "instructorId" TEXT NOT NULL,
    "templateId" TEXT,
    "isCustomised" BOOLEAN NOT NULL DEFAULT false,
    "classType" TEXT,
    "classStyle" TEXT,
    "rating" INTEGER,
    "reflectionNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClassInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassInstance_classId_idx" ON "ClassInstance"("classId");

-- CreateIndex
CREATE INDEX "ClassInstance_instructorId_idx" ON "ClassInstance"("instructorId");

-- CreateIndex
CREATE INDEX "ClassInstance_date_idx" ON "ClassInstance"("date");

-- CreateIndex
CREATE INDEX "ClassInstance_templateId_idx" ON "ClassInstance"("templateId");

-- CreateIndex
CREATE INDEX "Class_templateId_idx" ON "Class"("templateId");

-- AddForeignKey
ALTER TABLE "PlanSection" ADD CONSTRAINT "PlanSection_classInstanceId_fkey" FOREIGN KEY ("classInstanceId") REFERENCES "ClassInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ClassPlanTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassInstance" ADD CONSTRAINT "ClassInstance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassInstance" ADD CONSTRAINT "ClassInstance_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassInstance" ADD CONSTRAINT "ClassInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ClassPlanTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
