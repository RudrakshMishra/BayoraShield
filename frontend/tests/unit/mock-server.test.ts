import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../mock/server";
import type { Server } from "http";
import {
  BreachResult,
  Metric,
  AuditResult,
  LedgerHead,
  VerifyResult,
  Run,
} from "../../src/api/schemas";

describe("Mock Server Implementation (Milestone F2 Contract Verification)", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // Helper to extract cookies from Set-Cookie header
  function parseCookies(setCookieHeaders: string[]): { session?: string; csrf?: string } {
    const cookies: { session?: string; csrf?: string } = {};
    for (const header of setCookieHeaders) {
      const parts = header.split(";")[0].split("=");
      if (parts[0] === "session") cookies.session = parts[1];
      if (parts[0] === "csrf") cookies.csrf = parts[1];
    }
    return cookies;
  }

  describe("6.1 Auth, CSRF, and Roles", () => {
    it("rejects invalid credentials with generic 401 error", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "wrong_password" }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.message).toBe("Invalid credentials");
    });

    it("logs in successfully as admin and sets session + csrf cookies", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin123" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.username).toBe("admin");
      expect(body.user.role).toBe("admin");
      expect(body.user.demo_controls).toBe(true);

      const setCookies = res.headers.getSetCookie();
      const cookies = parseCookies(setCookies);
      expect(cookies.session).toBeDefined();
      expect(cookies.csrf).toBeDefined();
    });

    it("enforces CSRF check on state-changing requests", async () => {
      // Login as operator
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "operator", password: "operator123" }),
      });
      const cookies = parseCookies(loginRes.headers.getSetCookie());

      // Attempt POST without X-CSRF-Token header
      const missingCsrfRes = await fetch(`${baseUrl}/api/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session=${cookies.session}; csrf=${cookies.csrf}`,
        },
        body: JSON.stringify({ mode: "shield" }),
      });
      expect(missingCsrfRes.status).toBe(403);

      // Attempt POST with valid X-CSRF-Token header
      const validCsrfRes = await fetch(`${baseUrl}/api/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session=${cookies.session}; csrf=${cookies.csrf}`,
          "X-CSRF-Token": cookies.csrf!,
        },
        body: JSON.stringify({ mode: "shield" }),
      });
      expect(validCsrfRes.status).toBe(201);
    });

    it("enforces role gating: viewer cannot create run or verify ledger", async () => {
      // Login as viewer
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer", password: "viewer123" }),
      });
      const cookies = parseCookies(loginRes.headers.getSetCookie());

      // Viewer attempts POST /api/runs (requires operator)
      const runRes = await fetch(`${baseUrl}/api/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session=${cookies.session}; csrf=${cookies.csrf}`,
          "X-CSRF-Token": cookies.csrf!,
        },
        body: JSON.stringify({ mode: "shield" }),
      });
      expect(runRes.status).toBe(403);

      // Viewer attempts POST /api/ledger/verify (requires operator)
      const verifyRes = await fetch(`${baseUrl}/api/ledger/verify`, {
        method: "POST",
        headers: {
          Cookie: `session=${cookies.session}; csrf=${cookies.csrf}`,
          "X-CSRF-Token": cookies.csrf!,
        },
      });
      expect(verifyRes.status).toBe(403);
    });
  });

  describe("6.3 SHA-256 Hash-Chained Ledger (Verify, Tamper, Restore)", () => {
    let adminCookies: { session?: string; csrf?: string };

    beforeAll(async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin123" }),
      });
      adminCookies = parseCookies(loginRes.headers.getSetCookie());
    });

    it("verifies clean ledger successfully", async () => {
      const res = await fetch(`${baseUrl}/api/ledger/verify`, {
        method: "POST",
        headers: {
          Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
          "X-CSRF-Token": adminCookies.csrf!,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      const parsed = VerifyResult.parse(data);
      expect(parsed.ok).toBe(true);
      expect(parsed.first_bad_seq).toBeNull();
      expect(parsed.checked).toBeGreaterThan(40);
    });

    it("retrieves ledger head and paginated entries", async () => {
      const headRes = await fetch(`${baseUrl}/api/ledger/head`, {
        headers: { Cookie: `session=${adminCookies.session}` },
      });
      expect(headRes.status).toBe(200);
      const head = LedgerHead.parse(await headRes.json());
      expect(head.seq).toBeGreaterThan(40);

      const entriesRes = await fetch(`${baseUrl}/api/ledger/entries?from=1&limit=10`, {
        headers: { Cookie: `session=${adminCookies.session}` },
      });
      expect(entriesRes.status).toBe(200);
      const entries = await entriesRes.json();
      expect(entries.length).toBe(10);
      expect(entries[0].seq).toBe(1);
    });

    it("detects tampering at exact block and then restores ledger", async () => {
      // 1. Tamper block seq 32
      const tamperRes = await fetch(`${baseUrl}/api/demo/tamper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
          "X-CSRF-Token": adminCookies.csrf!,
        },
        body: JSON.stringify({ seq: 32 }),
      });
      expect(tamperRes.status).toBe(200);

      // 2. Verify should now fail at seq 32
      const verifyRes = await fetch(`${baseUrl}/api/ledger/verify`, {
        method: "POST",
        headers: {
          Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
          "X-CSRF-Token": adminCookies.csrf!,
        },
      });
      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      expect(verifyData.ok).toBe(false);
      expect(verifyData.first_bad_seq).toBe(32);
      expect(verifyData.reason).toContain("Hash mismatch");

      // 3. Restore via untamper
      const untamperRes = await fetch(`${baseUrl}/api/demo/untamper`, {
        method: "POST",
        headers: {
          Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
          "X-CSRF-Token": adminCookies.csrf!,
        },
      });
      expect(untamperRes.status).toBe(200);

      // 4. Verify should now succeed again
      const verifyAfterRestore = await fetch(`${baseUrl}/api/ledger/verify`, {
        method: "POST",
        headers: {
          Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
          "X-CSRF-Token": adminCookies.csrf!,
        },
      });
      const restoredData = await verifyAfterRestore.json();
      expect(restoredData.ok).toBe(true);
      expect(restoredData.first_bad_seq).toBeNull();
    });
  });

  describe("6.4 Results & Fixtures", () => {
    let viewerCookies: { session?: string; csrf?: string };

    beforeAll(async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer", password: "viewer123" }),
      });
      viewerCookies = parseCookies(loginRes.headers.getSetCookie());
    });

    it("serves all 14 breach test results validating BreachResult schema", async () => {
      const res = await fetch(`${baseUrl}/api/results/breach`, {
        headers: { Cookie: `session=${viewerCookies.session}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results.length).toBe(14);
      data.results.forEach((r: unknown) => {
        expect(BreachResult.safeParse(r).success).toBe(true);
      });
    });

    it("serves metrics validating Metric schema", async () => {
      const res = await fetch(`${baseUrl}/api/results/metrics`, {
        headers: { Cookie: `session=${viewerCookies.session}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.metrics.length).toBeGreaterThan(0);
      data.metrics.forEach((m: unknown) => {
        expect(Metric.safeParse(m).success).toBe(true);
      });
    });

    it("serves audit results for all-pass and one-fail scenarios", async () => {
      // Default / all-pass
      const passRes = await fetch(`${baseUrl}/api/audit/latest?scenario=all-pass`, {
        headers: { Cookie: `session=${viewerCookies.session}` },
      });
      expect(passRes.status).toBe(200);
      const passData = await passRes.json();
      passData.results.forEach((r: unknown) => {
        const parsed = AuditResult.parse(r);
        expect(parsed.status).toBe("pass");
      });

      // one-fail scenario
      const failRes = await fetch(`${baseUrl}/api/audit/latest?scenario=one-fail`, {
        headers: { Cookie: `session=${viewerCookies.session}` },
      });
      expect(failRes.status).toBe(200);
      const failData = await failRes.json();
      const hasFail = failData.results.some((r: any) => r.status === "fail");
      expect(hasFail).toBe(true);
    });
  });

  describe("6.5 Runs & Hostile Red Bursts", () => {
    let operatorCookies: { session?: string; csrf?: string };

    beforeAll(async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "operator", password: "operator123" }),
      });
      operatorCookies = parseCookies(loginRes.headers.getSetCookie());
    });

    it("creates, retrieves, and triggers hostile-red escape script", async () => {
      // 1. Create run
      const createRes = await fetch(`${baseUrl}/api/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session=${operatorCookies.session}; csrf=${operatorCookies.csrf}`,
          "X-CSRF-Token": operatorCookies.csrf!,
        },
        body: JSON.stringify({ mode: "both", dataset: "hack-in-hills-suite-04", requests: 250 }),
      });
      expect(createRes.status).toBe(201);
      const run = Run.parse(await createRes.json());
      expect(run.status).toBe("running");

      // 2. Fetch run by ID
      const getRes = await fetch(`${baseUrl}/api/runs/${run.id}`, {
        headers: { Cookie: `session=${operatorCookies.session}` },
      });
      expect(getRes.status).toBe(200);
      const fetchedRun = Run.parse(await getRes.json());
      expect(fetchedRun.id).toBe(run.id);

      // 3. Launch Hostile Red
      const hostileRes = await fetch(`${baseUrl}/api/runs/${run.id}/hostile-red`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session=${operatorCookies.session}; csrf=${operatorCookies.csrf}`,
          "X-CSRF-Token": operatorCookies.csrf!,
        },
        body: JSON.stringify({ confirm: true }),
      });
      expect(hostileRes.status).toBe(202);
      const hostileData = await hostileRes.json();
      expect(hostileData.started).toBe(true);
    });
  });
});
