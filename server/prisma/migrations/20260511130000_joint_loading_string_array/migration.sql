-- AlterTable
ALTER TABLE "Exercise" ALTER COLUMN "jointLoading" DROP DEFAULT;

ALTER TABLE "Exercise" ALTER COLUMN "jointLoading" TYPE TEXT[] USING (
  CASE
    WHEN "jointLoading" IS NULL THEN ARRAY[]::TEXT[]
    ELSE ARRAY["jointLoading"]::TEXT[]
  END
);

ALTER TABLE "Exercise" ALTER COLUMN "jointLoading" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Exercise" ALTER COLUMN "jointLoading" SET NOT NULL;
