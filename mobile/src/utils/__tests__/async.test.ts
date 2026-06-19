import { TIMEOUT, withTimeout } from "../async";

describe("withTimeout", () => {
  it("resolves when promise completes in time", async () => {
    const result = await withTimeout(Promise.resolve("ok"), 500);
    expect(result).toBe("ok");
  });

  it("returns TIMEOUT symbol when promise is slow", async () => {
    jest.useFakeTimers();
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late"), 200);
    });
    const resultPromise = withTimeout(slow, 50);
    jest.advanceTimersByTime(50);
    await expect(resultPromise).resolves.toBe(TIMEOUT);
    jest.useRealTimers();
  });
});
