-- AlterTable
ALTER TABLE "classes" ADD COLUMN "subjectIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
