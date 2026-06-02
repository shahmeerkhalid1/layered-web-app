-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "injuries" TEXT,
    "focusAreas" TEXT,
    "goals" TEXT,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "classInstanceId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_instructorId_idx" ON "Client"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_instructorId_key" ON "Client"("email", "instructorId");

-- CreateIndex
CREATE INDEX "Enrollment_clientId_idx" ON "Enrollment"("clientId");

-- CreateIndex
CREATE INDEX "Enrollment_classId_idx" ON "Enrollment"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_clientId_classId_key" ON "Enrollment"("clientId", "classId");

-- CreateIndex
CREATE INDEX "Attendance_clientId_idx" ON "Attendance"("clientId");

-- CreateIndex
CREATE INDEX "Attendance_classInstanceId_idx" ON "Attendance"("classInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_clientId_classInstanceId_key" ON "Attendance"("clientId", "classInstanceId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classInstanceId_fkey" FOREIGN KEY ("classInstanceId") REFERENCES "ClassInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
