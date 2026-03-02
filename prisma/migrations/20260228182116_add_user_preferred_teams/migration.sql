-- CreateTable
CREATE TABLE "UserPreferredTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPreferredTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPreferredTeam_userId_idx" ON "UserPreferredTeam"("userId");

-- CreateIndex
CREATE INDEX "UserPreferredTeam_teamId_idx" ON "UserPreferredTeam"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferredTeam_userId_teamId_key" ON "UserPreferredTeam"("userId", "teamId");

-- AddForeignKey
ALTER TABLE "UserPreferredTeam" ADD CONSTRAINT "UserPreferredTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferredTeam" ADD CONSTRAINT "UserPreferredTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
