import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../../src/state/authStore";
import { sseRegistry } from "../../src/api/sse";

describe("Auth Store & Session Management", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
  });

  it("initializes with unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("logs in successfully and populates user info", async () => {
    const mockUser = { username: "operator", role: "operator" as const, demo_controls: false };
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ user: mockUser }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await useAuthStore.getState().login("operator", "operator123");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.username).toBe("operator");
    expect(state.user?.role).toBe("operator");
  });

  it("logout clears session state and closes all registered SSE connections", async () => {
    const closeSpy = vi.fn();
    const fakeEventSource = { close: closeSpy } as unknown as EventSource;
    sseRegistry.register(fakeEventSource);

    expect(sseRegistry.count).toBe(1);

    // Set logged in state
    useAuthStore.setState({
      user: { username: "admin", role: "admin", demo_controls: true },
      isAuthenticated: true,
    });

    const mockFetch = vi.fn().mockResolvedValue({ status: 204, ok: true });
    vi.stubGlobal("fetch", mockFetch);

    await useAuthStore.getState().logout();

    expect(sseRegistry.count).toBe(0);
    expect(closeSpy).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("clears session and closes SSE when unauthorized event is received", () => {
    const closeSpy = vi.fn();
    const fakeEventSource = { close: closeSpy } as unknown as EventSource;
    sseRegistry.register(fakeEventSource);

    useAuthStore.setState({
      user: { username: "viewer", role: "viewer", demo_controls: false },
      isAuthenticated: true,
    });

    window.dispatchEvent(new CustomEvent("bayorashield:unauthorized"));

    expect(sseRegistry.count).toBe(0);
    expect(closeSpy).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
