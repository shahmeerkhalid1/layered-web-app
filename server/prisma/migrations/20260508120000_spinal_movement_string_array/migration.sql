-- AlterTable
ALTER TABLE "Exercise" ALTER COLUMN "spinalMovement" DROP DEFAULT;

ALTER TABLE "Exercise" ALTER COLUMN "spinalMovement" TYPE TEXT[] USING (
  CASE
    WHEN "spinalMovement" IS NULL THEN ARRAY[]::TEXT[]
    ELSE ARRAY["spinalMovement"]::TEXT[]
  END
);

ALTER TABLE "Exercise" ALTER COLUMN "spinalMovement" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Exercise" ALTER COLUMN "spinalMovement" SET NOT NULL;
