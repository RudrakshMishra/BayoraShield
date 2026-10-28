import { create } from "zustand";
import { User, type UserT } from "../api/schemas";
import { apiFetch, ApiRequestError } from "../api/apiFetch";
import { sseRegistry } from "../api/sse";

interface AuthState {
  user: UserT | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  fetchMe: () => Promise<UserT | null>;
  login: (username: string, password: string) => Promise<UserT>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await apiFetch<UserT>("/auth/me", { schema: User });
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("bayora_user", JSON.stringify(user));
        } catch {
          // ignore
        }
      }
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return user;
    } catch {
      // Fallback: check localStorage for static/Netlify sessions
      if (typeof window !== "undefined") {
        try {
          const stored = window.localStorage.getItem("bayora_user");
          if (stored) {
            const parsed = User.safeParse(JSON.parse(stored));
            if (parsed.success) {
              set({ user: parsed.data, isAuthenticated: true, isLoading: false, error: null });
              return parsed.data;
            }
          }
        } catch {
          // ignore
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch<{ user: UserT }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const validatedUser = User.parse(res.user);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("bayora_user", JSON.stringify(validatedUser));
        } catch {
          // ignore
        }
      }
      set({ user: validatedUser, isAuthenticated: true, isLoading: false, error: null });
      return validatedUser;
    } catch (err: unknown) {
      set({ isLoading: false });
      if (err instanceof ApiRequestError) {
        set({ error: err.message });
      } else {
        set({ error: "Failed to sign in. Please try again." });
      }
      throw err;
    }
  },

  logout: async () => {
    // 1. Close all active SSE connections immediately
    sseRegistry.closeAll();

    // 2. Clear state and storage
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("bayora_user");
        document.cookie = "session=; path=/; max-age=0";
        document.cookie = "csrf=; path=/; max-age=0";
      } catch {
        // ignore
      }
    }
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });

    // 3. Inform server to clear session and cookies
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
  },

  clearError: () => set({ error: null }),
}));

// Automatic session teardown on 401 anywhere in the app
if (typeof window !== "undefined") {
  window.addEventListener("bayorashield:unauthorized", () => {
    sseRegistry.closeAll();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });
}
