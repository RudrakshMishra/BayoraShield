import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  User,
  AppEvent,
  LedgerHead,
  VerifyResult,
  BreachResult,
  Metric,
  AuditResult,
  Run,
  type LedgerEntryT,
  type RunT,
  type AppEventT,
} from "../src/api/schemas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load mock environment variables
function loadEnv() {
  const envPath = path.resolve(__dirname, ".env.mock");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").trim();
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}
loadEnv();

const PORT = parseInt(process.env.PORT || "4000", 10);
const DEMO_CONTROLS_ENABLED = process.env.DEMO_CONTROLS_ENABLED !== "false";

// Demo Users
interface DemoAccount {
  username: string;
  passwordHash: string;
  role: "viewer" | "operator" | "admin";
  demo_controls: boolean;
}

const DEMO_USERS: Record<string, DemoAccount> = {
  admin: {
    username: process.env.DEMO_ADMIN_USERNAME || "admin",
    passwordHash: "admin123",
    role: "admin",
    demo_controls: true,
  },
  operator: {
    username: process.env.DEMO_OPERATOR_USERNAME || "operator",
    passwordHash: "operator123",
    role: "operator",
    demo_controls: false,
  },
  viewer: {
    username: process.env.DEMO_VIEWER_USERNAME || "viewer",
    passwordHash: "viewer123",
    role: "viewer",
    demo_controls: false,
  },
};

// In-Memory State
interface Session {
  id: string;
  username: string;
  role: "viewer" | "operator" | "admin";
  demo_controls: boolean;
  expiresAt: number;
}

const sessions = new Map<string, Session>();
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

// SSE Clients
interface SseClient {
  id: string;
  stack: "shield" | "baseline";
  res: Response;
  sessionId: string;
}
const sseClients = new Map<string, SseClient>();

// SHA-256 Ledger State
function computeEntryHash(entry: {
  prev_hash: string;
  seq: number;
  ts: string;
  cell: string;
  action: string;
  payload_hash: string | null;
  meta?: Record<string, string | number | boolean>;
}): string {
  const metaStr = entry.meta ? JSON.stringify(entry.meta) : "{}";
  const payloadStr = entry.payload_hash || "";
  const raw = `${entry.prev_hash}:${entry.seq}:${entry.ts}:${entry.cell}:${entry.action}:${payloadStr}:${metaStr}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function computeSig(entryHash: string): string {
  return crypto.createHash("sha256").update(`sig:${entryHash}:bayora-secret-salt`).digest("hex");
}

let ledgerEntries: LedgerEntryT[] = [];
let cleanLedgerBackup: LedgerEntryT[] = [];

function seedLedger() {
  ledgerEntries = [];
  let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  const actions: Array<{
    cell: string;
    action: string;
    meta: Record<string, string | number | boolean>;
  }> = [
    { cell: "broker", action: "policy_bootstrap", meta: { version: "v1.4.0" } },
    { cell: "red", action: "container_spawn", meta: { isolated: true } },
    { cell: "blue", action: "evaluator_seal", meta: { network: "none" } },
    { cell: "model", action: "model_weights_loaded", meta: { weights: "sha256:7f83b165" } },
    { cell: "red", action: "send_eval_query", meta: { attempt_id: "att_001" } },
    { cell: "broker", action: "policy_verdict_allowed", meta: { verdict: "clean" } },
    { cell: "model", action: "token_generation", meta: { tokens: 128 } },
    { cell: "blue", action: "evaluator_score", meta: { score: 0.98 } },
  ];

  const now = Date.now();
  for (let i = 1; i <= 48; i++) {
    const act = actions[(i - 1) % actions.length];
    const ts = new Date(now - (49 - i) * 120000).toISOString();
    const payloadHash = crypto.createHash("sha256").update(`payload_${i}`).digest("hex");

    const partial = {
      prev_hash: prevHash,
      seq: i,
      ts,
      cell: act.cell,
      action: act.action,
      payload_hash: payloadHash,
      meta: { ...act.meta, seq_index: i },
    };

    const entryHash = computeEntryHash(partial);
    const sig = computeSig(entryHash);

    const entry: LedgerEntryT = {
      ...partial,
      entry_hash: entryHash,
      sig,
    };

    ledgerEntries.push(entry);
    prevHash = entryHash;
  }
  cleanLedgerBackup = JSON.parse(JSON.stringify(ledgerEntries));
}
seedLedger();

// Runs State
let runs: RunT[] = [
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

// App Setup
export const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Helper: send contract error
function sendError(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({
    error: { code, message },
  });
}

// Authentication Middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies.session;
  if (!sessionId) {
    return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
  }

  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(sessionId);
    res.clearCookie("session");
    res.clearCookie("csrf");
    return sendError(res, 401, "UNAUTHORIZED", "Session expired or invalid");
  }

  (req as any).user = session;
  next();
}

// CSRF Validation Middleware
function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    // Exempt login endpoint
    if (req.path === "/auth/login" || req.path === "/api/auth/login") {
      return next();
    }

    const csrfCookie = req.cookies.csrf;
    const csrfHeader = req.headers["x-csrf-token"];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return sendError(res, 403, "FORBIDDEN", "Missing or invalid CSRF token");
    }
  }
  next();
}

app.use(verifyCsrf);

// Role Authorization Middleware
function requireRole(minRole: "viewer" | "operator" | "admin") {
  const hierarchy = { viewer: 1, operator: 2, admin: 3 };
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as Session | undefined;
    if (!user) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    if (hierarchy[user.role] < hierarchy[minRole]) {
      return sendError(res, 403, "FORBIDDEN", `Insufficient role. Requires ${minRole}+`);
    }

    next();
  };
}

// --- 6.1 AUTH ENDPOINTS ---

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  const ip = req.ip || "127.0.0.1";
  const rateKey = `${ip}:${username || ""}`;

  // Check 429 lockout
  const attempt = failedLoginAttempts.get(rateKey);
  if (attempt && attempt.lockedUntil > Date.now()) {
    const retrySec = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
    return res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: `Too many failed attempts. Locked out for ${retrySec} seconds.`,
      },
    });
  }

  const account = Object.values(DEMO_USERS).find((u) => u.username === username);

  if (!account || account.passwordHash !== password) {
    // Increment failed attempt
    const current = failedLoginAttempts.get(rateKey) || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = Date.now() + 60000; // 60s lockout
      current.count = 0;
    }
    failedLoginAttempts.set(rateKey, current);

    // Generic error message: never reveal which part was wrong
    return sendError(res, 401, "UNAUTHORIZED", "Invalid credentials");
  }

  // Login success: reset lockout
  failedLoginAttempts.delete(rateKey);

  const sessionId = "sess_" + crypto.randomBytes(24).toString("hex");
  const csrfToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const sessionObj: Session = {
    id: sessionId,
    username: account.username,
    role: account.role,
    demo_controls: DEMO_CONTROLS_ENABLED && account.role === "admin",
    expiresAt,
  };
  sessions.set(sessionId, sessionObj);

  // Set session cookie: HttpOnly; SameSite=Strict; Secure if https
  res.cookie("session", sessionId, {
    httpOnly: true,
    sameSite: "strict",
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });

  // Set csrf cookie: readable; SameSite=Strict
  res.cookie("csrf", csrfToken, {
    httpOnly: false,
    sameSite: "strict",
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });

  const userPayload = {
    username: account.username,
    role: account.role,
    demo_controls: sessionObj.demo_controls,
  };

  // Validate with Zod
  const validatedUser = User.parse(userPayload);
  return res.status(200).json({ user: validatedUser });
});

app.post("/api/auth/logout", authenticate, (req: Request, res: Response) => {
  const sessionId = req.cookies.session;
  if (sessionId) {
    sessions.delete(sessionId);
    // Close associated SSE connections
    for (const [clientId, client] of sseClients.entries()) {
      if (client.sessionId === sessionId) {
        client.res.end();
        sseClients.delete(clientId);
      }
    }
  }

  res.clearCookie("session", { path: "/" });
  res.clearCookie("csrf", { path: "/" });
  return res.status(204).send();
});

app.get("/api/auth/me", authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as Session;
  const data = {
    username: user.username,
    role: user.role,
    demo_controls: user.demo_controls,
  };
  return res.status(200).json(User.parse(data));
});

// --- 6.2 EVENTS SSE STREAM ---

let eventCounter = 1000;

function broadcastEvent(event: AppEventT, targetStack?: "shield" | "baseline") {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients.values()) {
    if (!targetStack || client.stack === targetStack) {
      try {
        client.res.write(data);
      } catch {
        // Handled in close
      }
    }
  }
}

app.get("/api/events", authenticate, (req: Request, res: Response) => {
  const stack = (req.query.stack === "baseline" ? "baseline" : "shield") as "shield" | "baseline";
  const sessionId = req.cookies.session;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const clientId = "client_" + crypto.randomBytes(8).toString("hex");
  sseClients.set(clientId, { id: clientId, stack, res, sessionId });

  // Send initial keep-alive comment
  res.write(": keep-alive\n\n");

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch {
      clearInterval(keepAliveInterval);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(keepAliveInterval);
    sseClients.delete(clientId);
  });
});

// Background simulation ticker: emits realistic metadata traffic 2-4 times/sec
setInterval(() => {
  if (sseClients.size === 0) return;

  eventCounter++;
  const ts = new Date().toISOString();
  const id = `evt_${eventCounter.toString().padStart(6, "0")}`;

  const normalEvents: Omit<AppEventT, "id" | "ts">[] = [
    { type: "request", actor: "red", boundary: "red->broker", outcome: "allowed", ledger_seq: 4500 + (eventCounter % 100) },
    { type: "verdict", actor: "broker", boundary: "broker->blue", outcome: "allowed", ledger_seq: 4500 + (eventCounter % 100) },
    { type: "model_call", actor: "broker", boundary: "broker->model", outcome: "allowed", ledger_seq: null },
    { type: "ledger_append", actor: "broker", boundary: "broker->ledger", outcome: "allowed", ledger_seq: 4500 + (eventCounter % 100) },
  ];

  const template = normalEvents[Math.floor(Math.random() * normalEvents.length)];
  const event = AppEvent.parse({ id, ts, ...template });

  // Broadcast to all clients
  broadcastEvent(event);

  // Occasionally simulate a breach attempt
  if (eventCounter % 5 === 0) {
    const breachId = `evt_${(eventCounter + 1).toString().padStart(6, "0")}`;
    const breachBoundaries = ["red->blue", "cell->docker.sock", "red->internet", "broker->blue"];
    const boundary = breachBoundaries[eventCounter % breachBoundaries.length];

    // On Shield: blocked or denied
    const shieldBreach = AppEvent.parse({
      id: breachId,
      ts: new Date().toISOString(),
      type: "breach_attempt",
      actor: "red",
      boundary,
      outcome: "blocked",
      ledger_seq: 4500 + (eventCounter % 100),
    });
    broadcastEvent(shieldBreach, "shield");

    // On Baseline: allowed
    const baselineBreach = AppEvent.parse({
      id: breachId,
      ts: new Date().toISOString(),
      type: "breach_attempt",
      actor: "red",
      boundary,
      outcome: "allowed",
      ledger_seq: 4500 + (eventCounter % 100),
    });
    broadcastEvent(baselineBreach, "baseline");
  }
}, 350);

// --- 6.3 LEDGER ENDPOINTS ---

app.get("/api/ledger/head", authenticate, requireRole("viewer"), (_req: Request, res: Response) => {
  const last = ledgerEntries[ledgerEntries.length - 1];
  const head = {
    seq: last ? last.seq : 0,
    entry_hash: last ? last.entry_hash : "0000000000000000000000000000000000000000000000000000000000000000",
    count: ledgerEntries.length,
    anchored_at: new Date(Date.now() - 300000).toISOString(),
  };
  return res.status(200).json(LedgerHead.parse(head));
});

app.get("/api/ledger/entries", authenticate, requireRole("viewer"), (req: Request, res: Response) => {
  const from = parseInt((req.query.from as string) || "1", 10);
  const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100);

  const start = Math.max(0, from - 1);
  const page = ledgerEntries.slice(start, start + limit);
  return res.status(200).json(page);
});

app.post("/api/ledger/verify", authenticate, requireRole("operator"), (_req: Request, res: Response) => {
  let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  let firstBadSeq: number | null = null;
  let reason: string | null = null;
  let checked = 0;

  for (const entry of ledgerEntries) {
    checked++;
    // Verify previous hash chaining
    if (entry.prev_hash !== prevHash) {
      firstBadSeq = entry.seq;
      reason = `Chain broken: prev_hash does not match preceding entry_hash at seq ${entry.seq}`;
      break;
    }

    // Verify SHA-256 entry hash
    const expectedHash = computeEntryHash({
      prev_hash: entry.prev_hash,
      seq: entry.seq,
      ts: entry.ts,
      cell: entry.cell,
      action: entry.action,
      payload_hash: entry.payload_hash,
      meta: entry.meta,
    });

    if (entry.entry_hash !== expectedHash) {
      firstBadSeq = entry.seq;
      reason = `Hash mismatch: expected ${expectedHash.slice(0, 8)}... but found ${entry.entry_hash.slice(0, 8)}... at seq ${entry.seq}`;
      break;
    }

    prevHash = entry.entry_hash;
  }

  const last = ledgerEntries[ledgerEntries.length - 1];
  const headHash = last ? last.entry_hash : prevHash;

  const result = {
    ok: firstBadSeq === null,
    checked,
    first_bad_seq: firstBadSeq,
    reason,
    head_hash: headHash,
  };

  return res.status(200).json(VerifyResult.parse(result));
});

// Demo Tamper
app.post("/api/demo/tamper", authenticate, requireRole("admin"), (req: Request, res: Response) => {
  if (!DEMO_CONTROLS_ENABLED) {
    return sendError(res, 404, "NOT_FOUND", "Demo controls are disabled");
  }

  const seq = typeof req.body.seq === "number" ? req.body.seq : 32;
  const target = ledgerEntries.find((e) => e.seq === seq);

  if (!target) {
    return sendError(res, 404, "NOT_FOUND", `Ledger entry seq ${seq} not found`);
  }

  // Tamper action and meta without updating hash
  target.action = "tampered_compromised_action";
  target.meta = { ...target.meta, tampered: true };

  return res.status(200).json({ tampered: true, seq });
});

// Demo Untamper
app.post("/api/demo/untamper", authenticate, requireRole("admin"), (_req: Request, res: Response) => {
  if (!DEMO_CONTROLS_ENABLED) {
    return sendError(res, 404, "NOT_FOUND", "Demo controls are disabled");
  }

  ledgerEntries = JSON.parse(JSON.stringify(cleanLedgerBackup));
  return res.status(200).json({ restored: true });
});

// --- 6.4 RESULTS ENDPOINTS ---

app.get("/api/results/breach", authenticate, requireRole("viewer"), (_req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, "fixtures/breach.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  // Validate results array with Zod
  const parsedResults = data.results.map((r: unknown) => BreachResult.parse(r));
  return res.status(200).json({ run_id: data.run_id, results: parsedResults });
});

app.get("/api/results/metrics", authenticate, requireRole("viewer"), (_req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, "fixtures/metrics.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  const parsedMetrics = data.metrics.map((m: unknown) => Metric.parse(m));
  return res.status(200).json({ run_id: data.run_id, metrics: parsedMetrics });
});

app.get("/api/audit/latest", authenticate, requireRole("viewer"), (req: Request, res: Response) => {
  const scenario = req.query.scenario === "one-fail" || process.env.AUDIT_SCENARIO === "one-fail" ? "one-fail" : "all-pass";
  const fileName = `fixtures/audit.${scenario}.json`;
  const filePath = path.resolve(__dirname, fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  const parsedResults = data.results.map((r: unknown) => AuditResult.parse(r));
  return res.status(200).json({ ts: data.ts, results: parsedResults });
});

// --- 6.5 RUNS ENDPOINTS ---

app.post("/api/runs", authenticate, requireRole("operator"), (req: Request, res: Response) => {
  const { mode = "shield", dataset = "standard-adversarial-v1" } = req.body || {};

  if (!["baseline", "shield", "both"].includes(mode)) {
    return sendError(res, 400, "BAD_REQUEST", "Invalid mode. Must be baseline, shield, or both");
  }

  const runId = "run_" + crypto.randomBytes(6).toString("hex");
  const now = new Date().toISOString();

  const newRun: RunT = {
    id: runId,
    mode,
    status: "running",
    started_at: now,
    finished_at: null,
    dataset_hash: crypto.createHash("sha256").update(dataset).digest("hex").slice(0, 32),
    model_hash: crypto.createHash("sha256").update("model_v1").digest("hex").slice(0, 32),
    policy_version: "v1.4.0",
  };

  runs.unshift(newRun);

  // Broadcast run event
  broadcastEvent(
    AppEvent.parse({
      id: `evt_${Date.now()}`,
      ts: now,
      type: "run",
      actor: "operator",
      boundary: "broker->broker",
      outcome: "allowed",
      ledger_seq: null,
    })
  );

  // Simulate completion after 5 seconds
  setTimeout(() => {
    newRun.status = "finished";
    newRun.finished_at = new Date().toISOString();
  }, 5000);

  return res.status(201).json(Run.parse(newRun));
});

app.get("/api/runs", authenticate, requireRole("viewer"), (_req: Request, res: Response) => {
  return res.status(200).json(runs.map((r) => Run.parse(r)));
});

app.get("/api/runs/:id", authenticate, requireRole("viewer"), (req: Request, res: Response) => {
  const run = runs.find((r) => r.id === req.params.id);
  if (!run) {
    return sendError(res, 404, "NOT_FOUND", `Run ${req.params.id} not found`);
  }
  return res.status(200).json(Run.parse(run));
});

app.post("/api/runs/:id/hostile-red", authenticate, requireRole("operator"), (req: Request, res: Response) => {
  const { confirm } = req.body || {};
  if (confirm !== true) {
    return sendError(res, 400, "CONFIRMATION_REQUIRED", "Action requires confirm: true");
  }

  const run = runs.find((r) => r.id === req.params.id);
  if (!run) {
    return sendError(res, 404, "NOT_FOUND", `Run ${req.params.id} not found`);
  }

  // Emit rapid hostile burst of 12 breach attempt events
  const burstBoundaries = [
    "red->blue",
    "cell->docker.sock",
    "red->internet",
    "broker->blue",
    "red->broker",
    "cell->ptrace",
  ];

  let burstIdx = 0;
  const burstTimer = setInterval(() => {
    if (burstIdx >= 12) {
      clearInterval(burstTimer);
      return;
    }

    const bound = burstBoundaries[burstIdx % burstBoundaries.length];
    const ts = new Date().toISOString();
    const evtId = `evt_hostile_${Date.now()}_${burstIdx}`;

    // Shield stream: blocked
    broadcastEvent(
      AppEvent.parse({
        id: evtId,
        ts,
        type: "breach_attempt",
        actor: "red",
        boundary: bound,
        outcome: "blocked",
        ledger_seq: 4600 + burstIdx,
      }),
      "shield"
    );

    // Baseline stream: allowed
    broadcastEvent(
      AppEvent.parse({
        id: evtId,
        ts,
        type: "breach_attempt",
        actor: "red",
        boundary: bound,
        outcome: "allowed",
        ledger_seq: 4600 + burstIdx,
      }),
      "baseline"
    );

    burstIdx++;
  }, 100);

  return res.status(202).json({ started: true });
});

// Environment Reset
app.post("/api/reset", authenticate, requireRole("admin"), (req: Request, res: Response) => {
  const { confirm } = req.body || {};
  if (confirm !== true) {
    return sendError(res, 400, "CONFIRMATION_REQUIRED", "Reset requires confirm: true");
  }

  seedLedger();
  runs = [
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

  return res.status(202).json({ started: true });
});

// Fallback 404
app.use((_req: Request, res: Response) => {
  return sendError(res, 404, "NOT_FOUND", "Endpoint not found");
});

// If run directly
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BayoraShield Mock Server] listening on http://0.0.0.0:${PORT}`);
    console.log(`[BayoraShield Mock Server] API Base: http://127.0.0.1:${PORT}/api`);
    console.log(`[BayoraShield Mock Server] Demo accounts: admin, operator, viewer (password: <role>123)`);
  });
}
