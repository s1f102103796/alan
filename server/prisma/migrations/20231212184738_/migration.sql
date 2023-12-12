-- CreateTable
CREATE TABLE "GitHubAction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "bubbleId" TEXT NOT NULL,

    CONSTRAINT "GitHubAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubAction_bubbleId_key" ON "GitHubAction"("bubbleId");

-- AddForeignKey
ALTER TABLE "GitHubAction" ADD CONSTRAINT "GitHubAction_bubbleId_fkey" FOREIGN KEY ("bubbleId") REFERENCES "Bubble"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
