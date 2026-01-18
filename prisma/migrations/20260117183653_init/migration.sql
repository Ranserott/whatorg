-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "content" TEXT,
    "senderName" TEXT,
    "senderNumber" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "direction" "Direction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "messages_whatsappId_key" ON "messages"("whatsappId");

-- CreateIndex
CREATE INDEX "messages_instanceName_createdAt_idx" ON "messages"("instanceName", "createdAt");

-- CreateIndex
CREATE INDEX "messages_senderNumber_createdAt_idx" ON "messages"("senderNumber", "createdAt");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");
