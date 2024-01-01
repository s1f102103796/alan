-- CreateTable
CREATE TABLE "AppEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "appId" TEXT NOT NULL,
    "bubbleId" TEXT NOT NULL,

    CONSTRAINT "AppEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppEvent" ADD CONSTRAINT "AppEvent_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppEvent" ADD CONSTRAINT "AppEvent_bubbleId_fkey" FOREIGN KEY ("bubbleId") REFERENCES "Bubble"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
