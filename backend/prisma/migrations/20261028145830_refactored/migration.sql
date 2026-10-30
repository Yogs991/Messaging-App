/*
  Warnings:

  - You are about to drop the column `title` on the `Chat` table. All the data in the column will be lost.
  - The primary key for the `ChatMember` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId,chatId]` on the table `ChatMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropIndex
DROP INDEX "Message_chatId_createdAt_idx";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "title",
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ChatMember" DROP CONSTRAINT "ChatMember_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Message" DROP CONSTRAINT "Message_pkey",
ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "editedAt" TIMESTAMP(3),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "senderId" DROP NOT NULL,
ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Message_id_seq";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Chat_updatedAt_idx" ON "Chat"("updatedAt");

-- CreateIndex
CREATE INDEX "ChatMember_userId_idx" ON "ChatMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_userId_chatId_key" ON "ChatMember"("userId", "chatId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
