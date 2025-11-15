-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "desiredOutcome" TEXT NOT NULL,
    "constraints" TEXT[],
    "evaluationCriteria" JSONB NOT NULL,
    "submissionFormat" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);
