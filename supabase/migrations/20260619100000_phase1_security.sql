-- Phase 1: Security hardening (RLS + rate limiting)
-- Run in Supabase SQL Editor or via: supabase db push

-- ---------------------------------------------------------------------------
-- Rate limiting (edge functions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "EdgeFunctionRateLimit" (
  bucket TEXT NOT NULL,
  window_key TEXT NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, window_key)
);

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_bucket TEXT,
  p_window_key TEXT,
  p_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO "EdgeFunctionRateLimit" (bucket, window_key, hit_count)
  VALUES (p_bucket, p_window_key, 1)
  ON CONFLICT (bucket, window_key)
  DO UPDATE SET
    hit_count = "EdgeFunctionRateLimit".hit_count + 1,
    updated_at = now()
  RETURNING hit_count INTO v_count;
  RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_rate_limit(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(TEXT, TEXT, INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- Helper: current authenticated client user id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM "ClientUser"
  WHERE "authUserId" = auth.uid()::text
    AND "deletedAt" IS NULL
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security — defense in depth for anon/authenticated direct access
-- Edge functions continue to use service_role; these policies protect leaks.
-- ---------------------------------------------------------------------------

ALTER TABLE "ClientUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Business" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceStaff" ENABLE ROW LEVEL SECURITY;

-- ClientUser: own profile only
DROP POLICY IF EXISTS "client_user_select_own" ON "ClientUser";
CREATE POLICY "client_user_select_own" ON "ClientUser"
  FOR SELECT TO authenticated
  USING ("authUserId" = auth.uid()::text AND "deletedAt" IS NULL);

DROP POLICY IF EXISTS "client_user_update_own" ON "ClientUser";
CREATE POLICY "client_user_update_own" ON "ClientUser"
  FOR UPDATE TO authenticated
  USING ("authUserId" = auth.uid()::text AND "deletedAt" IS NULL)
  WITH CHECK ("authUserId" = auth.uid()::text);

-- Appointments: own records
DROP POLICY IF EXISTS "appointment_select_own" ON "Appointment";
CREATE POLICY "appointment_select_own" ON "Appointment"
  FOR SELECT TO authenticated
  USING ("clientUserId" = public.current_client_id() AND "deletedAt" IS NULL);

-- Client notifications: own records
DROP POLICY IF EXISTS "client_notification_select_own" ON "ClientNotification";
CREATE POLICY "client_notification_select_own" ON "ClientNotification"
  FOR SELECT TO authenticated
  USING ("clientUserId" = public.current_client_id() AND "deletedAt" IS NULL);

DROP POLICY IF EXISTS "client_notification_update_own" ON "ClientNotification";
CREATE POLICY "client_notification_update_own" ON "ClientNotification"
  FOR UPDATE TO authenticated
  USING ("clientUserId" = public.current_client_id())
  WITH CHECK ("clientUserId" = public.current_client_id());

-- Reviews: read public clinic reviews; insert own
DROP POLICY IF EXISTS "review_select_public" ON "Review";
CREATE POLICY "review_select_public" ON "Review"
  FOR SELECT TO authenticated, anon
  USING ("deletedAt" IS NULL);

DROP POLICY IF EXISTS "review_insert_own" ON "Review";
CREATE POLICY "review_insert_own" ON "Review"
  FOR INSERT TO authenticated
  WITH CHECK ("clientUserId" = public.current_client_id());

-- Catalog: read active public data
DROP POLICY IF EXISTS "business_select_active" ON "Business";
CREATE POLICY "business_select_active" ON "Business"
  FOR SELECT TO authenticated, anon
  USING ("deletedAt" IS NULL);

DROP POLICY IF EXISTS "service_select_active" ON "Service";
CREATE POLICY "service_select_active" ON "Service"
  FOR SELECT TO authenticated, anon
  USING ("isActive" = true AND "deletedAt" IS NULL);

DROP POLICY IF EXISTS "team_member_select_active" ON "TeamMember";
CREATE POLICY "team_member_select_active" ON "TeamMember"
  FOR SELECT TO authenticated, anon
  USING ("isActive" = true AND "deletedAt" IS NULL);

DROP POLICY IF EXISTS "service_staff_select_active" ON "ServiceStaff";
CREATE POLICY "service_staff_select_active" ON "ServiceStaff"
  FOR SELECT TO authenticated, anon
  USING ("isActive" = true AND "deletedAt" IS NULL);

-- Rate limit table: service role only (no client policies)
ALTER TABLE "EdgeFunctionRateLimit" ENABLE ROW LEVEL SECURITY;
