export interface LogMeta {
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

export function createLogger(req: Request, action = "unknown") {
  const requestId = crypto.randomUUID().slice(0, 12);
  const started = Date.now();
  let currentAction = action;

  const base = () => ({
    requestId,
    action: currentAction,
    method: req.method,
    path: new URL(req.url).pathname,
  });

  const write = (level: string, message: string, meta?: LogMeta) => {
    console.log(
      JSON.stringify({
        level,
        ...base(),
        message,
        latencyMs: Date.now() - started,
        ...meta,
        ts: new Date().toISOString(),
      }),
    );
  };

  return {
    requestId,
    setAction(next: string) {
      currentAction = next;
    },
    info(message: string, meta?: LogMeta) {
      write("info", message, meta);
    },
    warn(message: string, meta?: LogMeta) {
      write("warn", message, meta);
    },
    error(message: string, err?: unknown, meta?: LogMeta) {
      const errMsg = err instanceof Error ? err.message : err != null ? String(err) : undefined;
      write("error", message, { ...meta, error: errMsg });
    },
    finish(meta?: LogMeta) {
      write("info", "request_complete", meta);
    },
  };
}

export function captureEdgeException(
  log: ReturnType<typeof createLogger>,
  err: unknown,
  meta?: LogMeta,
) {
  log.error("unhandled_exception", err, meta);
}
