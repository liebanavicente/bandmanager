-- CreateTable
CREATE TABLE "LyricsProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "mastery" INTEGER NOT NULL DEFAULT 0,
    "lastScore" INTEGER,
    "lastMode" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "weakLines" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LyricsProgress_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "LyricsProgress_userId_nextReviewAt_idx" ON "LyricsProgress"("userId", "nextReviewAt");
-- CreateIndex
CREATE UNIQUE INDEX "LyricsProgress_userId_songId_key" ON "LyricsProgress"("userId", "songId");
-- AddForeignKey
ALTER TABLE "LyricsProgress" ADD CONSTRAINT "LyricsProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "LyricsProgress" ADD CONSTRAINT "LyricsProgress_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
