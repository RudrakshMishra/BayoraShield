import type { ZodType } from "zod";
import { ApiRequestError } from "./apiFetch";
import type { UserT, BreachResultT, MetricT, AuditResultT, LedgerHeadT, LedgerEntryT, VerifyResultT, RunT } from "./schemas";

export const DEMO_USERS: Record<string, { password: string; role: "admin" | "operator" | "viewer"; demo_controls: boolean }> = {
  admin: { password: "admin123", role: "admin", demo_controls: true },
  operator: { password: "operator123", role: "operator", demo_controls: false },
  viewer: { password: "viewer123", role: "viewer", demo_controls: false },
};

// Seed breach results
const MOCK_BREACH_RESULTS: BreachResultT[] = [
  { test_id: "B01", name: "Blue reads Red's payload directory", attempt: "Path traversal probe", baseline: "succeeded", shield: "blocked", control: "Per-cell mounts" },
  { test_id: "B02", name: "Red connects directly to Blue", attempt: "TCP SYN probe to Blue container port 8000", baseline: "succeeded", shield: "blocked", control: "Separate internal networks" },
  { test_id: "B03", name: "Any cell reaches the internet", attempt: "Outbound HTTP egress to external safety endpoint", baseline: "succeeded", shield: "blocked", control: "Internal-only networks" },
  { test_id: "B04", name: "DNS exfiltration attempt", attempt: "UDP query to rogue external resolver", baseline: "succeeded", shield: "blocked", control: "No external DNS" },
  { test_id: "B05", name: "Forbidden syscall (ptrace, mount, unshare)", attempt: "ptrace PTRACE_ATTACH syscall invocation", baseline: "succeeded", shield: "blocked", control: "seccomp & drop capabilities" },
  { test_id: "B06", name: "Red attempts to mount host Docker socket", attempt: "UNIX domain socket open /var/run/docker.sock", baseline: "succeeded", shield: "blocked", control: "No Docker socket mount" },
  { test_id: "B07", name: "Red attempts ARP spoofing on internal network", attempt: "Gratuitous ARP broadcast to poison broker IP", baseline: "succeeded", shield: "blocked", control: "Isolated veth point-to-point" },
  { test_id: "B08", name: "Memory resource exhaustion attack (OOM killer)", attempt: "Allocating 32GB RAM via malloc bomb", baseline: "succeeded", shield: "blocked", control: "cgroup memory.max limits" },
  { test_id: "B09", name: "CPU starvation probe", attempt: "Spawning 256 infinite busy-loop threads", baseline: "succeeded", shield: "blocked", control: "cgroup cpu.max throttling" },
  { test_id: "B10", name: "Timing side-channel extraction on policy broker", attempt: "Statistical analysis of 10k response intervals", baseline: "succeeded", shield: "blocked", control: "Constant-time response padding" },
  { test_id: "B11", name: "Prompt injection evasion via unicode zero-width spaces", attempt: "Injecting hidden instruction tokens in payload", baseline: "succeeded", shield: "blocked", control: "Broker payload normalization" },
  { test_id: "B12", name: "Payload tamper attempt inside broker queue", attempt: "Memory buffer overwrite via shared IPC", baseline: "succeeded", shield: "blocked", control: "Zero shared memory segments" },
  { test_id: "B13", name: "Model weight inspection via /proc memory map", attempt: "Reading /proc/$PID/mem across namespaces", baseline: "succeeded", shield: "blocked", control: "PID namespace isolation" },
  { test_id: "B14", name: "Ledger entry repudiation attempt", attempt: "Modifying prior event hash in append stream", baseline: "succeeded", shield: "blocked", control: "SHA-256 Merkle chain verification" },
];

// Seed metrics
const MOCK_METRICS: MetricT[] = [
  { name: "Canary crossings", value: 0, unit: "count", n: 100, group: "leakage" },
  { name: "Breach tests blocked (shield)", value: 14, unit: "tests", n: 14, group: "defense" },
  { name: "Breach tests succeeded (baseline)", value: 12, unit: "tests", n: 14, group: "defense" },
  { name: "Latency p50 (baseline)", value: 42.4, unit: "ms", n: 500, group: "latency" },
  { name: "Latency p50 (shield)", value: 48.1, unit: "ms", n: 500, group: "latency" },
  { name: "Latency p95 (baseline)", value: 94.8, unit: "ms", n: 500, group: "latency" },
  { name: "Latency p95 (shield)", value: 112.3, unit: "ms", n: 500, group: "latency" },
  { name: "Timing leak AUC (before mitigation)", value: 0.94, unit: "AUC", n: 250, group: "leakage" },
  { name: "Timing leak AUC (with mitigation)", value: 0.51, unit: "AUC", n: 250, group: "leakage" },
];

// Seed audit invariants
const MOCK_AUDIT_PASS: AuditResultT[] = [
  { invariant: "Privileged mode disabled", status: "pass", detail: "All 4 containers running without privileged flags" },
  { invariant: "Linux capabilities dropped", status: "pass", detail: "CAP_SYS_ADMIN, CAP_NET_ADMIN, CAP_SYS_PTRACE dropped" },
  { invariant: "Read-only root filesystem", status: "pass", detail: "Container root mounted read-only, ephemeral tmpfs only" },
  { invariant: "Docker socket unmounted", status: "pass", detail: "/var/run/docker.sock not present in any tenant mount" },
  { invariant: "Networks internal-only", status: "pass", detail: "No default gateway, internal: true on all bridge networks" },
  { invariant: "One network per cell boundary", status: "pass", detail: "Red-Broker (net_red) and Broker-Blue (net_blue) strictly segmented" },
  { invariant: "Evaluator network disabled", status: "pass", detail: "Evaluator container running in network_mode: none" },
  { invariant: "seccomp security profile active", status: "pass", detail: "Default seccomp profile loaded, blocking 44 dangerous syscalls" },
];

const MOCK_AUDIT_FAIL: AuditResultT[] = [
  ...MOCK_AUDIT_PASS.slice(0, 3),
  { invariant: "Docker socket unmounted", status: "fail", detail: "WARNING: /var/run/docker.sock mount detected in tenant Red" },
  ...MOCK_AUDIT_PASS.slice(4),
];

// Seed Ledger state
function generateMockLedger(): LedgerEntryT[] {
  const entries: LedgerEntryT[] = [];
  let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  const actions: { cell: "red" | "broker" | "model" | "blue"; action: string; meta: Record<string, string | number | boolean> }[] = [
    { cell: "red", action: "eval_request", meta: { dataset: "hack-in-hills-04", prompt_len: 412 } },
    { cell: "broker", action: "policy_check", meta: { policy: "v1.4.0", verdict: "allowed" } },
    { cell: "model", action: "inference_call", meta: { tokens_in: 412, tokens_out: 128 } },
    { cell: "blue", action: "safety_eval", meta: { toxic_score: 0.002, pass: true } },
    { cell: "broker", action: "ledger_commit", meta: { block_type: "merkle_leaf" } },
  ];

  for (let i = 1; i <= 50; i++) {
    const act = actions[(i - 1) % actions.length];
    // Deterministic synthetic hash
    const raw = `${prevHash}:${i}:${act.cell}:${act.action}`;
    let hash = 0;
    for (let c = 0; c < raw.length; c++) {
      hash = (hash << 5) - hash + raw.charCodeAt(c);
      hash |= 0;
    }
    const entryHash = Math.abs(hash).toString(16).padStart(16, "a") + "4f89d318e9c4021ef37651c6b12a0f8".slice(0, 48);
    const sig = "sig_" + Math.abs(hash).toString(16).padStart(32, "b");

    entries.push({
      seq: i,
      prev_hash: prevHash,
      entry_hash: entryHash,
      sig,
      ts: new Date(Date.now() - (50 - i) * 60000).toISOString(),
      cell: act.cell,
      action: act.action,
      payload_hash: "sha256_" + entryHash.slice(0, 16),
      meta: { ...act.meta, seq_index: i },
    });
    prevHash = entryHash;
  }
  return entries;
}

let mockLedger = generateMockLedger();
let cleanLedgerBackup = JSON.parse(JSON.stringify(mockLedger));
let isTampered = false;

// Mock Runs state
let mockRuns: RunT[] = [
  {
    id: "run_seed_001",
    mode: "both",
    status: "finished",
    started_at: new Date(Date.now() - 3600000).toISOString(),
    finished_at: new Date(Date.now() - 1800000).toISOString(),
    dataset_hash: "a4f89d318e9c4021ef37651c6b12a0f8",
    model_hash: "937812bcfe104820dc748291aeb47291",
    policy_version: "v1.4.0",
  },
];

/**
 * Handles client-side mock fallback when backend is unreachable or returning 404 (e.g. Netlify static deploy).
 */
export function handleMockFallback<T>(
  endpoint: string,
  method: string,
  rawBody?: unknown,
  _schema?: ZodType<any>
): T | undefined {
  const cleanEndpoint = endpoint.replace(/^\/?api/, "").split("?")[0];
  const queryStr = endpoint.includes("?") ? endpoint.split("?")[1] : "";
  const params = new globalThis.URLSearchParams(queryStr);

  // 1. Auth: /auth/login
  if (cleanEndpoint === "/auth/login" && method === "POST") {
    let body: any = {};
    try {
      body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody || {};
    } catch {
      body = {};
    }
    const { username, password } = body;
    const account = DEMO_USERS[username];

    if (!account || account.password !== password) {
      throw new ApiRequestError(401, "UNAUTHORIZED", "Invalid credentials");
    }

    const user: UserT = {
      username,
      role: account.role,
      demo_controls: account.demo_controls,
    };

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("bayora_user", JSON.stringify(user));
        document.cookie = `session=sess_demo_${username}; path=/; max-age=86400; SameSite=Strict`;
        document.cookie = `csrf=csrf_demo_${Date.now()}; path=/; max-age=86400; SameSite=Strict`;
      } catch {
        // ignore
      }
    }

    return { user } as unknown as T;
  }

  // 2. Auth: /auth/me
  if (cleanEndpoint === "/auth/me" && method === "GET") {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("bayora_user");
        if (stored) {
          const user = JSON.parse(stored);
          return user as unknown as T;
        }
      } catch {
        // ignore
      }
    }
    throw new ApiRequestError(401, "UNAUTHORIZED", "Authentication required");
  }

  // 3. Auth: /auth/logout
  if (cleanEndpoint === "/auth/logout") {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("bayora_user");
        document.cookie = "session=; path=/; max-age=0";
        document.cookie = "csrf=; path=/; max-age=0";
      } catch {
        // ignore
      }
    }
    return undefined as unknown as T;
  }

  // 4. Breach Results: /results/breach
  if (cleanEndpoint === "/results/breach") {
    return {
      run_id: "run_seed_001",
      results: MOCK_BREACH_RESULTS,
    } as unknown as T;
  }

  // 5. Metrics: /results/metrics
  if (cleanEndpoint === "/results/metrics") {
    return {
      run_id: "run_seed_001",
      metrics: MOCK_METRICS,
    } as unknown as T;
  }

  // 6. Audit Invariants: /audit/latest
  if (cleanEndpoint === "/audit/latest") {
    const scenario = params.get("scenario") === "one-fail" ? "one-fail" : "all-pass";
    return {
      ts: new Date().toISOString(),
      results: scenario === "one-fail" ? MOCK_AUDIT_FAIL : MOCK_AUDIT_PASS,
    } as unknown as T;
  }

  // 7. Ledger Head: /ledger/head
  if (cleanEndpoint === "/ledger/head") {
    const last = mockLedger[mockLedger.length - 1];
    const head: LedgerHeadT = {
      seq: last ? last.seq : 0,
      entry_hash: last ? last.entry_hash : "0000000000000000000000000000000000000000000000000000000000000000",
      count: mockLedger.length,
      anchored_at: new Date(Date.now() - 300000).toISOString(),
    };
    return head as unknown as T;
  }

  // 8. Ledger Entries: /ledger/entries
  if (cleanEndpoint === "/ledger/entries") {
    const from = parseInt(params.get("from") || "1", 10);
    const limit = Math.min(parseInt(params.get("limit") || "30", 10), 100);
    const start = Math.max(0, from - 1);
    const page = mockLedger.slice(start, start + limit);
    return page as unknown as T;
  }

  // 9. Ledger Verify: /ledger/verify
  if (cleanEndpoint === "/ledger/verify") {
    const last = mockLedger[mockLedger.length - 1];
    const result: VerifyResultT = {
      ok: !isTampered,
      checked: mockLedger.length,
      first_bad_seq: isTampered ? 32 : null,
      reason: isTampered ? "Hash mismatch: entry tampered at seq 32" : null,
      head_hash: last ? last.entry_hash : "0000000000000000",
    };
    return result as unknown as T;
  }

  // 10. Demo Tamper: /demo/tamper
  if (cleanEndpoint === "/demo/tamper") {
    isTampered = true;
    const target = mockLedger.find((e) => e.seq === 32);
    if (target) {
      target.action = "tampered_compromised_action";
      target.meta = { ...target.meta, tampered: true };
    }
    return { tampered: true, seq: 32 } as unknown as T;
  }

  // 11. Demo Untamper: /demo/untamper
  if (cleanEndpoint === "/demo/untamper") {
    isTampered = false;
    mockLedger = JSON.parse(JSON.stringify(cleanLedgerBackup));
    return { restored: true } as unknown as T;
  }

  // 12. Runs: /runs
  if (cleanEndpoint === "/runs" && method === "GET") {
    return mockRuns as unknown as T;
  }

  if (cleanEndpoint === "/runs" && method === "POST") {
    let body: any = {};
    try {
      body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody || {};
    } catch {
      body = {};
    }
    const mode = body.mode || "shield";
    const runId = "run_" + Math.random().toString(36).slice(2, 8);
    const newRun: RunT = {
      id: runId,
      mode,
      status: "running",
      started_at: new Date().toISOString(),
      finished_at: null,
      dataset_hash: "a4f89d318e9c4021ef37651c6b12a0f8",
      model_hash: "937812bcfe104820dc748291aeb47291",
      policy_version: "v1.4.0",
    };
    mockRuns.unshift(newRun);
    setTimeout(() => {
      newRun.status = "finished";
      newRun.finished_at = new Date().toISOString();
    }, 4000);
    return newRun as unknown as T;
  }

  // 13. Hostile Red: /runs/:id/hostile-red
  if (cleanEndpoint.includes("/hostile-red")) {
    return { started: true } as unknown as T;
  }

  // 14. Reset: /reset
  if (cleanEndpoint === "/reset") {
    mockLedger = JSON.parse(JSON.stringify(cleanLedgerBackup));
    isTampered = false;
    return { started: true } as unknown as T;
  }

  return undefined;
}
