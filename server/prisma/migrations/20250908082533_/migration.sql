-- AlterTable
ALTER TABLE "public"."documents" ADD COLUMN     "state" BYTEA,
ALTER COLUMN "content" DROP NOT NULL;
