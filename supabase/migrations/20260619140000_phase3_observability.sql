-- Phase 3: Observability — product analytics + client error reports

CREATE TABLE IF NOT EXISTS "ProductAnalytics" (
  id TEXT PRIMARY KEY,
  "clientUserId" TEXT,
  event TEXT NOT NULL,
  properties JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ProductAnalytics_event_createdAt_idx"
  ON "ProductAnalytics" (event, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ProductAnalytics_clientUserId_idx"
  ON "ProductAnalytics" ("clientUserId");

CREATE TABLE IF NOT EXISTS "ClientErrorReport" (
  id TEXT PRIMARY KEY,
  "clientUserId" TEXT,
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  platform TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE "ProductAnalytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientErrorReport" ENABLE ROW LEVEL SECURITY;

-- No client policies: service-role edge functions only.
