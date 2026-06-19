-- Phase 4: Favorites, push tokens, appointment reminders

CREATE TABLE IF NOT EXISTS "ClientFavorite" (
  id TEXT PRIMARY KEY,
  "clientUserId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("clientUserId", "businessId")
);

CREATE INDEX IF NOT EXISTS "ClientFavorite_clientUserId_idx"
  ON "ClientFavorite" ("clientUserId");

CREATE TABLE IF NOT EXISTS "ClientPushToken" (
  id TEXT PRIMARY KEY,
  "clientUserId" TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClientPushToken_token_unique"
  ON "ClientPushToken" (token) WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "ClientPushToken_clientUserId_idx"
  ON "ClientPushToken" ("clientUserId") WHERE "deletedAt" IS NULL;

CREATE TABLE IF NOT EXISTS "AppointmentReminderLog" (
  id TEXT PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "reminderType" TEXT NOT NULL,
  "sentAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("appointmentId", "reminderType")
);

ALTER TABLE "ClientFavorite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientPushToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppointmentReminderLog" ENABLE ROW LEVEL SECURITY;
