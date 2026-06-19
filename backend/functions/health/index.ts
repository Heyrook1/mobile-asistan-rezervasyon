import { createAdminClient, handlePreflight, jsonResponse, nowIso } from "../_shared/auth.ts";
import { createLogger } from "../_shared/logger.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  const log = createLogger(req, "health");
  const started = Date.now();

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("Business").select("id").limit(1);
    const dbOk = !error;
    if (!dbOk) log.warn("db_probe_failed", { error: error?.message });

    const body = {
      status: dbOk ? "ok" : "degraded",
      service: "asistan-edge",
      db: dbOk ? "up" : "down",
      latencyMs: Date.now() - started,
      timestamp: nowIso(),
      version: Deno.env.get("APP_VERSION") ?? "1.0.0",
    };
    log.finish({ dbOk });
    return jsonResponse(body, dbOk ? 200 : 503, req);
  } catch (err) {
    log.error("health_check_failed", err);
    return jsonResponse(
      {
        status: "error",
        service: "asistan-edge",
        db: "unknown",
        latencyMs: Date.now() - started,
        timestamp: nowIso(),
      },
      503,
      req,
    );
  }
});
