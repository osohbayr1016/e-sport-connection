import { robustApiCall, fetchWithFallback } from "../../utils/apiUtils";

describe("robustApiCall", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("never repeats POST mutations after a server error", async () => {
    (fetch as jest.Mock).mockResolvedValue({ status: 503 });
    const response = await robustApiCall("/api/tournament-registrations/register", {
      method: "POST",
      body: JSON.stringify({ tournamentId: "example" }),
    }, { retries: 3, retryDelay: 0 });
    expect(response.status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries a safe GET after a transient 5xx", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ status: 200 });
    const response = await robustApiCall("/api/tournaments", { method: "GET" }, { retries: 2, retryDelay: 0 });
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("never repeats a timed-out DELETE", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("connection lost"));
    await expect(robustApiCall("/api/registration/1", { method: "DELETE" }, { retries: 2, retryDelay: 0 }))
      .rejects.toThrow("connection lost");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("marks fallback data as not sourced from the API", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ success: false }),
    });
    const result = await fetchWithFallback("/api/tournaments", { tournaments: [] }, {}, { retries: 0 });
    expect(result).toEqual({ data: { tournaments: [] }, isFromApi: false });
  });
});
