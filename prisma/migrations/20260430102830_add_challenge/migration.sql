-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_value_key" ON "Challenge"("value");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
