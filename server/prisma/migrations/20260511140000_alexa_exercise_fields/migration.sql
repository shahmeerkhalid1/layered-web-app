-- AlterTable: ExerciseLayer — manual finisher flag
ALTER TABLE "ExerciseLayer" ADD COLUMN "isFinisher" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Exercise — progression / regression notes
ALTER TABLE "Exercise" ADD COLUMN "progressionNotes" TEXT;
ALTER TABLE "Exercise" ADD COLUMN "regressionNotes" TEXT;

-- AlterTable: Exercise — equipment TEXT -> TEXT[] (preserve single value as one-element array)
ALTER TABLE "Exercise" ADD COLUMN "equipment_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "Exercise" SET "equipment_new" = CASE
  WHEN "equipment" IS NULL OR btrim("equipment") = '' THEN ARRAY[]::TEXT[]
  ELSE ARRAY["equipment"]::TEXT[]
END;
ALTER TABLE "Exercise" DROP COLUMN "equipment";
ALTER TABLE "Exercise" RENAME COLUMN "equipment_new" TO "equipment";

-- AlterTable: Exercise — chainType TEXT -> TEXT[]
ALTER TABLE "Exercise" ADD COLUMN "chainType_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "Exercise" SET "chainType_new" = CASE
  WHEN "chainType" IS NULL OR btrim("chainType") = '' THEN ARRAY[]::TEXT[]
  ELSE ARRAY["chainType"]::TEXT[]
END;
ALTER TABLE "Exercise" DROP COLUMN "chainType";
ALTER TABLE "Exercise" RENAME COLUMN "chainType_new" TO "chainType";
