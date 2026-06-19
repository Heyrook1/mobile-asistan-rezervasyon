export const TIMEOUT = Symbol("timeout");

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T | typeof TIMEOUT> {
  return Promise.race([
    promise,
    new Promise<typeof TIMEOUT>((resolve) => {
      setTimeout(() => resolve(TIMEOUT), ms);
    }),
  ]);
}
