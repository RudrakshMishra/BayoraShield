process.env.NODE_ENV = "test";
import http from "http";

async function runBackendTests() {
  console.log("\x1b[31m%s\x1b[0m", "============================================================");
  console.log("\x1b[31m%s\x1b[0m", "  BAYORA SHIELD — BACKEND VERIFICATION SUITE");
  console.log("\x1b[31m%s\x1b[0m", "============================================================");

  let baseUrl = "http://127.0.0.1:4000";
  let server: http.Server | null = null;

  // Check if backend server is already running on port 4000
  try {
    const probe = await fetch("http://127.0.0.1:4000/api/auth/me", {
      signal: AbortSignal.timeout(1200),
    });
    if (probe.status === 401 || probe.status === 200) {
      console.log("  \x1b[36m[Target]\x1b[0m Testing live running backend on http://127.0.0.1:4000\n");
    } else {
      throw new Error("Live server returned unexpected status");
    }
  } catch {
    // Spin up ephemeral test server
    const { app } = await import("./frontend/mock/server");
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
    const addr = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${addr.port}`;
    console.log(`  \x1b[36m[Target]\x1b[0m Started ephemeral backend on ${baseUrl}\n`);
  }

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${name}`);
      passed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${name}: ${msg}`);
      failed++;
    }
  }

  // 1. Auth rejection
  await test("Auth - Rejects invalid credentials with 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong_password" }),
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 2. Admin login & session/csrf cookies
  const adminCookies: { session?: string; csrf?: string } = {};
  await test("Auth - Admin login returns session + CSRF token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const body = (await res.json()) as { user: { role: string; username: string } };
    if (body.user.role !== "admin") throw new Error(`Expected admin role, got ${body.user.role}`);
    for (const cookie of res.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const [k, v] = pair.split("=");
      if (k === "session") adminCookies.session = v;
      if (k === "csrf") adminCookies.csrf = v;
    }
    if (!adminCookies.session || !adminCookies.csrf) throw new Error("Missing cookies");
  });

  // 3. User session retrieval
  await test("Auth - Retrieves authenticated admin session profile (/api/auth/me)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `session=${adminCookies.session}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as { username: string; role: string };
    if (data.username !== "admin" || data.role !== "admin") {
      throw new Error(`Unexpected user: ${data.username}`);
    }
  });

  // 4. Breach Results
  await test("Results - Serves all 14 adversarial attack test suites (/api/results/breach)", async () => {
    const res = await fetch(`${baseUrl}/api/results/breach`, {
      headers: { Cookie: `session=${adminCookies.session}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as { results?: unknown[] };
    if (!Array.isArray(data.results) || data.results.length !== 14) {
      throw new Error(`Expected 14 breach results, got ${data.results?.length}`);
    }
  });

  // 5. Robustness Metrics
  await test("Results - Serves latency, precision & containment metrics (/api/results/metrics)", async () => {
    const res = await fetch(`${baseUrl}/api/results/metrics`, {
      headers: { Cookie: `session=${adminCookies.session}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as { metrics?: unknown[] };
    if (!Array.isArray(data.metrics) || data.metrics.length === 0) {
      throw new Error("Missing metrics array");
    }
  });

  // 6. Audit Scenario
  await test("Results - Serves automated audit verification results (/api/audit/latest)", async () => {
    const res = await fetch(`${baseUrl}/api/audit/latest?scenario=all-pass`, {
      headers: { Cookie: `session=${adminCookies.session}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as { results?: unknown[] };
    if (!Array.isArray(data.results) || data.results.length === 0) {
      throw new Error("Invalid audit results");
    }
  });

  // 7. Ledger Head
  await test("Ledger - Retrieves Merkle chain head with sequence & hash (/api/ledger/head)", async () => {
    const res = await fetch(`${baseUrl}/api/ledger/head`, {
      headers: { Cookie: `session=${adminCookies.session}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as { seq?: number; entry_hash?: string; count?: number };
    if (typeof data.seq !== "number" || !data.entry_hash) {
      throw new Error("Invalid ledger head structure");
    }
  });

  // 8. Ledger Entries
  await test("Ledger - Returns paginated tamper-evident entries (/api/ledger/entries)", async () => {
    const res = await fetch(`${baseUrl}/api/ledger/entries?from=1&limit=10`, {
      headers: { Cookie: `session=${adminCookies.session}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const entries = (await res.json()) as unknown[];
    if (!Array.isArray(entries) || entries.length !== 10) {
      throw new Error(`Expected 10 entries, got ${entries.length}`);
    }
  });

  // 9. Ledger Verification
  await test("Ledger - Cryptographic SHA-256 chain verification succeeds (/api/ledger/verify)", async () => {
    const res = await fetch(`${baseUrl}/api/ledger/verify`, {
      method: "POST",
      headers: {
        Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
        "X-CSRF-Token": adminCookies.csrf!,
      },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = (await res.json()) as { ok?: boolean; first_bad_seq?: number | null };
    if (!data.ok) throw new Error(`Ledger verification failed: first bad seq is ${data.first_bad_seq}`);
  });

  // 10. Scenario Run Execution
  let runId = "";
  await test("Run Control - Creates and launches adversarial run campaign (/api/runs)", async () => {
    const res = await fetch(`${baseUrl}/api/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
        "X-CSRF-Token": adminCookies.csrf!,
      },
      body: JSON.stringify({ mode: "both", dataset: "hack-in-hills-suite-04" }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = (await res.json()) as { id?: string; status?: string };
    if (!data.id) throw new Error("Missing run id");
    runId = data.id;
  });

  // 11. Hostile Red Trigger
  await test("Run Control - Triggers Hostile Red burst containment (/api/runs/:id/hostile-red)", async () => {
    const res = await fetch(`${baseUrl}/api/runs/${runId}/hostile-red`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
        "X-CSRF-Token": adminCookies.csrf!,
      },
      body: JSON.stringify({ confirm: true }),
    });
    if (res.status !== 202) throw new Error(`Expected 202, got ${res.status}`);
    const data = (await res.json()) as { started?: boolean };
    if (!data.started) throw new Error("Hostile Red did not start");
  });

  // 12. Tamper Detection & Untamper
  await test("Demo Controls - Detects block tampering & restores clean chain", async () => {
    // 1. Tamper block 32
    const tamperRes = await fetch(`${baseUrl}/api/demo/tamper`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
        "X-CSRF-Token": adminCookies.csrf!,
      },
      body: JSON.stringify({ seq: 32 }),
    });
    if (tamperRes.status !== 200) throw new Error(`Tamper request failed with ${tamperRes.status}`);

    // 2. Verify should catch it
    const verifyFailRes = await fetch(`${baseUrl}/api/ledger/verify`, {
      method: "POST",
      headers: {
        Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
        "X-CSRF-Token": adminCookies.csrf!,
      },
    });
    const verifyFailData = (await verifyFailRes.json()) as { ok?: boolean; first_bad_seq?: number };
    if (verifyFailData.ok !== false || verifyFailData.first_bad_seq !== 32) {
      throw new Error(`Tamper detection failed: ${JSON.stringify(verifyFailData)}`);
    }

    // 3. Untamper
    const restoreRes = await fetch(`${baseUrl}/api/demo/untamper`, {
      method: "POST",
      headers: {
        Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
        "X-CSRF-Token": adminCookies.csrf!,
      },
    });
    if (restoreRes.status !== 200) throw new Error(`Restore request failed with ${restoreRes.status}`);

    // 4. Verify should pass again
    const verifyPassRes = await fetch(`${baseUrl}/api/ledger/verify`, {
      method: "POST",
      headers: {
        Cookie: `session=${adminCookies.session}; csrf=${adminCookies.csrf}`,
        "X-CSRF-Token": adminCookies.csrf!,
      },
    });
    const verifyPassData = (await verifyPassRes.json()) as { ok?: boolean };
    if (verifyPassData.ok !== true) throw new Error("Failed to verify restored clean ledger");
  });

  // 13. API 404 Fallback
  await test("API Fallback - Returns structured JSON 404 for unhandled API paths", async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-endpoint`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    const data = (await res.json()) as { error?: { code?: string } };
    if (data.error?.code !== "NOT_FOUND") throw new Error("Expected NOT_FOUND error code");
  });

  // 14. SPA Fallback
  await test("SPA Fallback - Client-side routes serve HTML entrypoint", async () => {
    const res = await fetch(`${baseUrl}/dashboard`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const text = await res.text();
    if (!text.includes("<!DOCTYPE html>") && !text.includes("<html")) {
      throw new Error("Expected HTML response for SPA route");
    }
  });

  console.log("\x1b[31m%s\x1b[0m", "------------------------------------------------------------");
  console.log(`  Summary: ${passed + failed} tests | \x1b[32m${passed} Passed\x1b[0m | \x1b[31m${failed} Failed\x1b[0m`);
  console.log("\x1b[31m%s\x1b[0m", "============================================================");

  process.exit(failed > 0 ? 1 : 0);
}

runBackendTests();
