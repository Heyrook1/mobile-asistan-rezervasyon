-- Phase 2: Compliance & Legal (KVKK / GDPR)
-- Run in Supabase SQL Editor after Phase 1 migration.

-- ---------------------------------------------------------------------------
-- Consent audit fields on ClientUser
-- ---------------------------------------------------------------------------
ALTER TABLE "ClientUser"
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "healthDataConsentAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "termsVersion" TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS "privacyVersion" TEXT DEFAULT '1.0';

-- ---------------------------------------------------------------------------
-- Data retention: purge soft-deleted client records after 30 days
-- Schedule via Supabase Dashboard → Database → Extensions → pg_cron (if available):
--   SELECT cron.schedule('purge-deleted-clients', '0 3 * * *', $$SELECT public.purge_deleted_client_data()$$);
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_deleted_client_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purged INTEGER := 0;
  v_cutoff TIMESTAMPTZ := now() - INTERVAL '30 days';
BEGIN
  -- Hard-delete anonymized client users past retention window
  WITH doomed AS (
    SELECT id FROM "ClientUser"
    WHERE "deletedAt" IS NOT NULL AND "deletedAt" < v_cutoff
  )
  DELETE FROM "ClientNotification" WHERE "clientUserId" IN (SELECT id FROM doomed);

  WITH doomed AS (
    SELECT id FROM "ClientUser"
    WHERE "deletedAt" IS NOT NULL AND "deletedAt" < v_cutoff
  )
  DELETE FROM "Review" WHERE "clientUserId" IN (SELECT id FROM doomed);

  DELETE FROM "ClientUser"
  WHERE "deletedAt" IS NOT NULL AND "deletedAt" < v_cutoff;

  GET DIAGNOSTICS v_purged = ROW_COUNT;
  RETURN v_purged;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_deleted_client_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_deleted_client_data() TO service_role;

COMMENT ON FUNCTION public.purge_deleted_client_data IS
  'Hard-deletes ClientUser rows (and related notifications/reviews) 30 days after soft delete. Schedule daily via pg_cron.';
