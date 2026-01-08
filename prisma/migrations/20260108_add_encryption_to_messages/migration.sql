-- AlterTable for encryption fields on messages
ALTER TABLE "messages" ADD COLUMN "encryptedContent" TEXT;
ALTER TABLE "messages" ADD COLUMN "encryptedAesKey" TEXT;
ALTER TABLE "messages" ADD COLUMN "iv" TEXT;
ALTER TABLE "messages" ADD COLUMN "encryptionVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "messages" ADD COLUMN "isEncrypted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable for encryption keys
CREATE TABLE "encryption_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "encryption_keys_userId_keyVersion_key" ON "encryption_keys"("userId", "keyVersion");

-- AddForeignKey
ALTER TABLE "encryption_keys" ADD CONSTRAINT "encryption_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
