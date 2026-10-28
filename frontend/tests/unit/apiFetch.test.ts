import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, ApiRequestError } from "../../src/api/apiFetch";
import { z } from "zod";

describe("apiFetch wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = "";
  });

  it("adds X-CSRF-Token header on POST requests when csrf cookie is present", async () => {
    document.cookie = "csrf=test-csrf-token-123; path=/";

    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/runs", {
      method: "POST",
      body: JSON.stringify({ mode: "shield" }),
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers["X-CSRF-Token"]).toBe("test-csrf-token-123");
  });

  it("does NOT add X-CSRF-Token on GET requests", async () => {
    document.cookie = "csrf=test-csrf-token-123; path=/";

    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ data: "ok" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/auth/me", { method: "GET" });

    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers["X-CSRF-Token"]).toBeUndefined();
  });

  it("maps 401 error correctly and dispatches unauthorized event", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    });
    vi.stubGlobal("fetch", mockFetch);

    const unauthorizedListener = vi.fn();
    window.addEventListener("bayorashield:unauthorized", unauthorizedListener);

    await expect(apiFetch("/auth/me")).rejects.toThrow(ApiRequestError);
    expect(unauthorizedListener).toHaveBeenCalled();
  });

  it("maps 429 rate limit correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 429,
      ok: false,
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/auth/login", { method: "POST" })).rejects.toThrow(
      "Too many requests"
    );
  });

  it("maps 500 error to generic server message without leaking raw details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/ledger/verify", { method: "POST" })).rejects.toThrow(
      "An internal server error occurred"
    );
  });

  it("validates data through passed schema successfully", async () => {
    const schema = z.object({ value: z.number() }).strict();
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ value: 42 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch<{ value: number }>("/test", { schema });
    expect(result.value).toBe(42);
  });

  it("rejects when backend returns data violating schema", async () => {
    const schema = z.object({ value: z.number() }).strict();
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ value: "not_a_number" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/test", { schema })).rejects.toThrow(
      "Received invalid data shape"
    );
  });
});
