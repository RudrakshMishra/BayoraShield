import type { ZodType } from "zod";
import { ApiError } from "./schemas";
import { handleMockFallback } from "./mockFallback";

export class ApiRequestError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export interface ApiFetchOptions extends RequestInit {
  schema?: ZodType<any>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { schema, headers = {}, ...rest } = options;
  const method = (rest.method || "GET").toUpperCase();

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (rest.body && typeof rest.body === "string" && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  // Attach CSRF token on state-changing methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const csrfToken = getCookie("csrf");
    if (csrfToken) {
      finalHeaders["X-CSRF-Token"] = csrfToken;
    }
  }

  const apiBase = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${apiBase}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      method,
      headers: finalHeaders,
      credentials: "same-origin",
    });
  } catch (err) {
    const fallback = handleMockFallback<T>(endpoint, method, rest.body, schema);
    if (fallback !== undefined) {
      return fallback;
    }
    throw new ApiRequestError(0, "NETWORK_ERROR", "Backend unreachable. Please check your connection or start the mock server.", err);
  }

  // Handle 404/405 (e.g. static Netlify deployments without backend server)
  if (response.status === 404 || response.status === 405) {
    const fallback = handleMockFallback<T>(endpoint, method, rest.body, schema);
    if (fallback !== undefined) {
      return fallback;
    }
  }

  // Handle 401 Unauthorized
  if (response.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.dispatchEvent(new CustomEvent("bayorashield:unauthorized"));
    }
    throw new ApiRequestError(401, "UNAUTHORIZED", "Authentication required. Please log in.");
  }

  // Handle 429 Rate Limit
  if (response.status === 429) {
    throw new ApiRequestError(429, "RATE_LIMITED", "Too many requests. Please wait before trying again.");
  }

  // Handle 5xx Server Errors
  if (response.status >= 500) {
    throw new ApiRequestError(response.status, "SERVER_ERROR", "An internal server error occurred. Please retry.");
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // Parse JSON response
  let data: unknown;
  try {
    data = await response.json();
  } catch (parseErr) {
    const fallback = handleMockFallback<T>(endpoint, method, rest.body, schema);
    if (fallback !== undefined) {
      return fallback;
    }
    throw new ApiRequestError(response.status, "INVALID_JSON", "Server returned non-JSON response.", parseErr);
  }

  // Handle 4xx Client Errors
  if (!response.ok) {
    const parsedError = ApiError.safeParse(data);
    if (parsedError.success) {
      throw new ApiRequestError(
        response.status,
        parsedError.data.error.code,
        parsedError.data.error.message
      );
    }
    throw new ApiRequestError(
      response.status,
      "API_ERROR",
      `Request failed with status ${response.status}`,
      data
    );
  }

  // Validate response data against Zod schema if provided
  if (schema) {
    const validation = schema.safeParse(data);
    if (!validation.success) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Zod schema validation failed for", url, validation.error.message);
      }
      throw new ApiRequestError(
        500,
        "SCHEMA_VALIDATION_ERROR",
        "Received invalid data shape from backend."
      );
    }
    return validation.data as T;
  }

  return data as T;
}
