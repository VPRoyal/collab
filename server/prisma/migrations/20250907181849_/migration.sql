-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "lastActive" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."document_editors" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "document_editors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_editors_documentId_idx" ON "public"."document_editors"("documentId");

-- CreateIndex
CREATE INDEX "document_editors_userId_idx" ON "public"."document_editors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "document_editors_documentId_userId_key" ON "public"."document_editors"("documentId", "userId");

-- CreateIndex
CREATE INDEX "chats_documentId_idx" ON "public"."chats"("documentId");

-- CreateIndex
CREATE INDEX "chats_userId_idx" ON "public"."chats"("userId");

-- AddForeignKey
ALTER TABLE "public"."document_editors" ADD CONSTRAINT "document_editors_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_editors" ADD CONSTRAINT "document_editors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
