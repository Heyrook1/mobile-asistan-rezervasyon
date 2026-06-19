import { ApiError } from "../client";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock("../../lib/network", () => ({
  isNetworkOnline: jest.fn(() => true),
}));

import { supabase } from "../../lib/supabase";
import { isNetworkOnline } from "../../lib/network";
import { myAppointments } from "../client";

const invokeMock = supabase.functions.invoke as jest.Mock;
const onlineMock = isNetworkOnline as jest.Mock;

describe("api client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onlineMock.mockReturnValue(true);
  });

  it("throws ApiError when offline", async () => {
    onlineMock.mockReturnValue(false);
    await expect(myAppointments()).rejects.toBeInstanceOf(ApiError);
    await expect(myAppointments()).rejects.toThrow(/İnternet bağlantısı yok/);
  });

  it("returns appointments on success", async () => {
    invokeMock.mockResolvedValue({
      data: { appointments: [{ id: "a1" }] },
      error: null,
    });
    const rows = await myAppointments();
    expect(rows).toEqual([{ id: "a1" }]);
    expect(invokeMock).toHaveBeenCalledWith("booking", { body: { action: "list" } });
  });

  it("throws ApiError with backend message from error context", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: {
        context: {
          json: async () => ({ message: "Bu saat az önce doldu." }),
        },
      },
    });
    await expect(myAppointments()).rejects.toThrow("Bu saat az önce doldu.");
  });
});
