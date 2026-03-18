-- CreateTable
CREATE TABLE "app_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_logs_type_idx" ON "app_logs"("type");

-- CreateIndex
CREATE INDEX "app_logs_createdAt_idx" ON "app_logs"("createdAt");
