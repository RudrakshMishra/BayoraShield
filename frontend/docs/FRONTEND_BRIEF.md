# BayoraShield Dashboard: Antigravity Build Brief

> **Read this whole file before writing any code.** It is the single source of truth for the frontend. Do not invent endpoints, fields or features that are not listed here. If something is unclear, make the smallest reasonable assumption, write it down in `docs/ASSUMPTIONS.md`, and continue.

---

## 0. How to use this file

1. Put this file at the repo root (suggested name: `docs/FRONTEND_BRIEF.md`) and also copy section 6 (the API contract) to `docs/contract.md`.
2. Open the project in Antigravity and point the agent at this file first.
3. Work through the milestones in section 15 **in order**, using the prompts in section 16.
4. A milestone is finished only when its "Done when" checklist passes and its tests are green.

---

## 1. Project context

**BayoraShield** is a secure isolation layer for adversarial AI safety testing (Hack in Hills '26, Track 04). A **Red team** (attacks), a **Blue team** (defenses) and a **client LLM** (the model under test) run side by side. The danger is leakage between them, which would invalidate every safety finding.

Architecture in one paragraph: Red, Blue's sealed evaluator and the Model run in separate sealed containers. A **Policy Broker** is the only route between them. Every action is written to a **signed, hash-chained Ledger**. A **Dashboard API** exposes read-only, metadata-only views to this frontend.

**This frontend's job:** let judges and operators *see* the isolation working: live topology, breach tests flipping from red to green, a side-by-side Baseline-vs-Shield comparison, a ledger whose tampering is visibly detected, and honest measured results.

**Team:** Rudraksh builds this frontend; Shashwat and Rudraksh build the backend with Claude Code. The backend may not exist yet, so everything here is built against a **mock server** first.

---

## 2. Non-negotiable rules

1. **Metadata only.** The UI never displays, stores, logs or requests payload content (attack prompts, classifier rules, model weights). Event objects are validated with `.strict()` Zod schemas, so an unexpected field such as `payload` or `prompt` fails validation and is dropped with a console error in dev.
2. **The browser talks only to the Dashboard API** (`/api/*`). It never calls the Broker, Ledger, Blue, Red or Model directly.
3. **No secrets in the browser.** No API keys, signing keys or passwords in source, env files shipped to the client, or `localStorage`.
4. **Auth tokens live in `HttpOnly; Secure; SameSite=Strict` cookies**, never in `localStorage` or `sessionStorage`.
5. **Render all event and API fields as plain text.** Never use `dangerouslySetInnerHTML`.
6. **No third-party network calls at runtime.** No CDNs, analytics, external fonts or icon services. Fonts are self-hosted via npm packages. (A strict same-origin CSP depends on this.)
7. **Do not claim a protection works unless the data shows it.** Any simulated value in mock mode is labelled "SIMULATED" in the UI.
8. **Role checks are enforced by the server.** Hiding a button in the UI is a convenience only.
9. **Do not change the contract unilaterally.** If you need a change, record it in `docs/CONTRACT_CHANGES.md` and keep the old shape working in the mock.

---

## 3. Tech stack (frontend)

| Need | Choice |
|---|---|
| Framework | React + Vite + TypeScript (strict mode) |
| Styling | Tailwind CSS with the design tokens in section 4 |
| Charts | Recharts |
| Animation | Framer Motion (topology packets, breach flips) |
| Server state | TanStack Query (REST) + native `EventSource` (SSE) |
| Routing | React Router |
| Client state | Zustand (small, only for UI state such as selected stack and theme) |
| Validation | Zod, schemas in `src/api/schemas.ts` (section 7) |
| Fonts | `@fontsource/montserrat`, `@fontsource/inter`, `@fontsource/jetbrains-mono` (self-hosted) |
| Icons | `lucide-react` (bundled, no CDN) |
| Unit tests | Vitest + React Testing Library |
| E2E tests | Playwright |
| Mock server | Node + Fastify (or Express) in `mock/`, started with `npm run mock` |
| Lint/format | ESLint + Prettier |

**Pin exact versions in `package.json`** (no `^` or `~`) and run `npm audit` before the freeze. Do not add packages beyond this list without a written reason in `docs/ASSUMPTIONS.md`.

---

## 4. Design system

Dark, calm, "security console" feel. Readable on a projector from the back of a room.

### 4.1 Color tokens (Tailwind theme + CSS variables)

| Token | Hex | Meaning |
|---|---|---|
| `--bg` | `#0B1727` | App background (ink) |
| `--surface` | `#12294A` | Cards, panels (deep navy) |
| `--surface-2` | `#17345C` | Raised or hovered panels |
| `--text` | `#F1F4F9` | Primary text |
| `--muted` | `#9AA7B8` | Secondary text |
| `--red` | `#E5484D` | Red team, blocked or failed attack outcome shown on the Baseline side, tamper |
| `--blue` | `#2F6FED` | Blue team, links, focus |
| `--grey` | `#6B7A8C` | Model cell, neutral |
| `--gold` | `#E8A33D` | Broker and Ledger, accents |
| `--green` | `#1FA971` | Pass, protected |
| `--teal` | `#0E7C86` | Secondary accent |

Rules: color is never the only signal. Every status also has an icon or text label ("BLOCKED", "SUCCEEDED", "PASS"). Maintain WCAG AA contrast on all text.

### 4.2 Typography

- Headings: **Montserrat** (600/700)
- Body and UI: **Inter** (400/500/600)
- Hashes, IDs, sequence numbers, code: **JetBrains Mono**
- Base size 16px; use 18px+ for headline numbers; hashes are shown truncated (first 8 and last 6 characters) with a copy button.

### 4.3 Layout and motion

- Left sidebar navigation, top bar with run status, mode badge (`MOCK` or `LIVE`) and user menu.
- 8px spacing scale, 12px card radius, subtle 1px borders (`rgba(255,255,255,0.08)`).
- Motion is purposeful: packets move along links; a blocked packet stops at the boundary, flashes red and shows a lock icon. Respect `prefers-reduced-motion` (replace motion with state changes).
- Desktop first (1280px and up); must not break on a 1024px laptop.

---

## 5. Screens

Build in this priority order. P0 screens are required for the demo.

| # | Screen | Route | Priority | Roles |
|---|---|---|---|---|
| 1 | Login | `/login` | P0 | public |
| 2 | Live Topology | `/` | P0 | viewer+ |
| 3 | Event Feed | `/events` | P0 | viewer+ |
| 4 | Breach Wall | `/breach` | P0 | viewer+ |
| 5 | Baseline vs Shield | `/compare` | P0 | viewer+ |
| 6 | Ledger Explorer | `/ledger` | P0 | viewer+ (Verify: operator+) |
| 7 | Results and Metrics | `/results` | P0 | viewer+ |
| 8 | Run Control | `/runs` | P1 | operator+ |
| 9 | Threat Model | `/threat-model` | P1 | viewer+ |
| 10 | Audit Status | `/audit` | P1 | viewer+ |

### 5.1 Login
Username and password form, generic error message ("Invalid credentials", never reveal which part was wrong), rate-limit message on HTTP 429, redirect to the originally requested route after login. On success the server sets cookies; the UI then calls `GET /auth/me`.

### 5.2 Live Topology (home)
- Nodes: **Red Cell** (red), **Blue Evaluator** (blue), **Model Cell** (grey), **Policy Broker** (gold, center), **Ledger** (gold-dark, below). Layout: Model top, Red left, Broker center, Blue right, Ledger bottom.
- Links: Broker to each cell (solid), Broker to Ledger (dashed, labelled "write-only"). **No link between Red and Blue**; show a small crossed-out dotted line with the caption "No direct cell-to-cell links".
- Packets animate along links as events arrive via SSE. `allowed` packets continue; `blocked` and `denied` packets stop at the boundary, flash red, and show a lock icon.
- Counters per node (requests, blocked, denied) and a legend. Clicking a node opens a side panel with its recent metadata events and its isolation facts (network, mounts, capabilities as reported by `GET /audit/latest`).
- A "stack" toggle (`shield` default) switches the stream source.

### 5.3 Event Feed
Virtualized table of the live SSE stream: time, type, actor, boundary, outcome (badge), ledger seq (links to Ledger Explorer). Filters by actor, outcome and type. Pause/resume. Keeps the latest 2,000 events in memory. Shows a banner "Metadata only: payload content is never shown".

### 5.4 Breach Wall
Grid of breach-test cards (14 minimum, driven by `GET /results/breach`). Each card shows test name, the attempt, **Baseline** result and **Shield** result, and the control that stopped it. Baseline side shows `SUCCEEDED` in red; Shield side shows `BLOCKED` in green with a flip animation from red to green when results load or a run completes. Summary bar: "X of N attempts blocked in BayoraShield; Y of N succeeded on Baseline". Filter by status.

### 5.5 Baseline vs Shield
Two columns, each a mini topology plus event feed, connected to `GET /events?stack=baseline` and `GET /events?stack=shield`. A single "Run same attack" button (operator+) calls `POST /runs` with `mode: "both"`. Under each column: leaks observed, canaries crossed, attempts blocked. This is the hero screen for the demo.

### 5.6 Ledger Explorer
- Horizontal chain of blocks (latest first), each showing `seq`, time, cell, action, truncated `prev_hash` and `entry_hash`, and signature status.
- Header shows the **head hash**, entry count and the last verification result.
- **Verify** button (operator+) calls `POST /ledger/verify`. On failure, the block at `first_bad_seq` turns red with the reason, and every later block shows "chain broken after seq N".
- A demo-only **Tamper** control (admin only, hidden unless `GET /auth/me` reports `demo_controls: true`) calls `POST /demo/tamper`, followed by Verify. Includes a confirmation dialog and a "Restore" action calling `POST /demo/untamper`.
- Paging through `GET /ledger/entries`.

### 5.7 Results and Metrics
Cards and charts from `GET /results/metrics`:
- Canary crossings (value with "across N runs"), target 0
- Breach tests blocked (shield) versus succeeded (baseline)
- Latency p50 and p95, baseline versus shield (bar chart)
- Timing-leak result before versus after mitigation (accuracy or AUC, with N)
- Tamper detection rate (edit, delete, insert, reorder, truncate), with a note for truncation: "detected only with external anchor or signed count"
- Block rate on attack prompts and false-positive rate on benign prompts
Every metric shows its `n`. Include an "Export JSON snapshot" button that downloads the current results as a file. A "Load snapshot" option lets the page render from a saved JSON when the backend is unreachable (offline demo fallback).

### 5.8 Run Control
Start a run (mode `baseline`, `shield` or `both`, dataset subset selector, number of requests), launch the **hostile Red** escape script (`POST /runs/{id}/hostile-red`, confirmation required), view run status and history, and reset the environment (admin only, confirmation required).

### 5.9 Threat Model
Static, well-designed page with three columns: **Protects against**, **Not fully covered**, **Roadmap**, plus a "Guarantees may fail if" strip. Content in section 12. Optionally render a Likelihood x Impact table for residual risks.

### 5.10 Audit Status
Shows the latest `bayora-audit` result: one row per invariant (privileged mode, capabilities dropped, read-only root FS, docker.sock mounted, networks internal, one network per cell, evaluator has no network, and so on) with PASS or FAIL and a detail string. A banner turns red if any invariant fails.

### 5.11 Cross-cutting UI requirements
- Loading skeletons, empty states and "backend unreachable" error states on every screen, with a Retry button.
- Mode badge `MOCK` or `LIVE` always visible; in mock mode every number carries a small "SIMULATED" tag.
- Keyboard navigable; visible focus rings; semantic HTML.
- Large type and high contrast so it reads on a projector.

---

## 6. API contract (copy this section to `docs/contract.md`)

Base path: `/api` (same origin through the reverse proxy; in dev, a Vite proxy forwards `/api` to the mock server). All timestamps are ISO 8601 UTC strings. All hashes are lowercase hex strings. All requests and responses are JSON unless noted.

### 6.1 Auth

| Method | Path | Body | Response | Role |
|---|---|---|---|---|
| POST | `/auth/login` | `{username, password}` | `200 {user}` and sets cookies `session` (HttpOnly) and `csrf` (readable) · `401` · `429` | public |
| POST | `/auth/logout` | none | `204`, clears cookies | any |
| GET | `/auth/me` | none | `200 {username, role, demo_controls}` or `401` | any |

- `role` is `viewer`, `operator` or `admin`.
- `demo_controls` is a boolean that is true only when the backend runs in demo mode.
- Every state-changing request (`POST`, `PUT`, `DELETE`) must send header `X-CSRF-Token` equal to the `csrf` cookie value. Missing or wrong token returns `403`.
- Unauthenticated requests return `401`. Insufficient role returns `403`.

### 6.2 Events (SSE)

`GET /events?stack=shield|baseline` (default `shield`), `Content-Type: text/event-stream`, authenticated by the session cookie. Each message is `data: <Event JSON>`. A comment line `: keep-alive` is sent every 15 seconds. The server closes the stream when the session expires.

Event shape (**metadata only**):

```json
{
  "id": "evt_000123",
  "ts": "2026-10-27T10:15:30.120Z",
  "type": "request",
  "actor": "red",
  "boundary": "red->broker",
  "outcome": "allowed",
  "ledger_seq": 4521
}
```

- `type`: `request`, `verdict`, `model_call`, `breach_attempt`, `ledger_append`, `audit`, `run`
- `actor`: `red`, `blue`, `model`, `broker`, `ledger`, `operator`
- `boundary`: free-form short string such as `red->broker`, `broker->blue`, `broker->model`, `broker->ledger`, `red->blue`, `red->internet`, `cell->docker.sock`
- `outcome`: `allowed`, `blocked`, `denied`
- `ledger_seq`: integer or `null`

### 6.3 Ledger

| Method | Path | Notes | Role |
|---|---|---|---|
| GET | `/ledger/head` | `{seq, entry_hash, count, anchored_at|null}` | viewer+ |
| GET | `/ledger/entries?from=&limit=` | page of `LedgerEntry` (limit max 100) | viewer+ |
| POST | `/ledger/verify` | `{ok, checked, first_bad_seq|null, reason|null, head_hash}` | operator+ |

`LedgerEntry`: `{seq, ts, cell, action, payload_hash, prev_hash, entry_hash, sig, meta}` where `meta` is a small object of metadata (never payload text).

Demo-only (return `404` unless demo mode is on):

| Method | Path | Body | Role |
|---|---|---|---|
| POST | `/demo/tamper` | `{seq}` | admin |
| POST | `/demo/untamper` | none | admin |

### 6.4 Results

| Method | Path | Response |
|---|---|---|
| GET | `/results/breach` | `{run_id, results: BreachResult[]}` |
| GET | `/results/metrics` | `{run_id, metrics: Metric[]}` |
| GET | `/audit/latest` | `{ts, results: AuditResult[]}` |

- `BreachResult`: `{test_id, name, attempt, baseline, shield, control}` where `baseline` and `shield` are `succeeded`, `blocked` or `n/a`.
- `Metric`: `{name, value, unit, n, group}` with `group` such as `latency`, `leakage`, `integrity`, `defense`.
- `AuditResult`: `{invariant, status, detail}` with `status` of `pass` or `fail`.

### 6.5 Runs

| Method | Path | Body | Response | Role |
|---|---|---|---|---|
| POST | `/runs` | `{mode: "baseline"|"shield"|"both", dataset: string, requests: number}` | `201 Run` | operator+ |
| GET | `/runs` | none | `Run[]` | viewer+ |
| GET | `/runs/{id}` | none | `Run` | viewer+ |
| POST | `/runs/{id}/hostile-red` | `{confirm: true}` | `202 {started: true}` | operator+ |
| POST | `/reset` | `{confirm: true}` | `202 {started: true}` | admin |

`Run`: `{id, mode, status, started_at, finished_at|null, dataset_hash, model_hash, policy_version}` with `status` of `pending`, `running`, `finished` or `failed`.

### 6.6 Errors

All errors use `{ "error": { "code": "string", "message": "string" } }` with an appropriate HTTP status. Do not display raw server messages for `5xx`; show a generic error with a Retry action.

---

## 7. Zod schemas (create `src/api/schemas.ts`)

Use `.strict()` on every object so unknown fields (especially payload-like ones) are rejected.

```ts
import { z } from "zod";

export const Role = z.enum(["viewer", "operator", "admin"]);

export const User = z
  .object({ username: z.string(), role: Role, demo_controls: z.boolean() })
  .strict();

export const Outcome = z.enum(["allowed", "blocked", "denied"]);
export const Actor = z.enum(["red", "blue", "model", "broker", "ledger", "operator"]);
export const EventType = z.enum([
  "request", "verdict", "model_call", "breach_attempt", "ledger_append", "audit", "run",
]);

export const AppEvent = z
  .object({
    id: z.string(),
    ts: z.string().datetime(),
    type: EventType,
    actor: Actor,
    boundary: z.string().max(64),
    outcome: Outcome,
    ledger_seq: z.number().int().nullable(),
  })
  .strict();

const Hex = z.string().regex(/^[0-9a-f]+$/);

export const LedgerEntry = z
  .object({
    seq: z.number().int(),
    ts: z.string().datetime(),
    cell: z.string(),
    action: z.string(),
    payload_hash: Hex.nullable(),
    prev_hash: Hex,
    entry_hash: Hex,
    sig: Hex,
    meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .strict();

export const LedgerHead = z
  .object({
    seq: z.number().int(),
    entry_hash: Hex,
    count: z.number().int(),
    anchored_at: z.string().datetime().nullable(),
  })
  .strict();

export const VerifyResult = z
  .object({
    ok: z.boolean(),
    checked: z.number().int(),
    first_bad_seq: z.number().int().nullable(),
    reason: z.string().nullable(),
    head_hash: Hex,
  })
  .strict();

const Attempt = z.enum(["succeeded", "blocked", "n/a"]);

export const BreachResult = z
  .object({
    test_id: z.string(),
    name: z.string(),
    attempt: z.string(),
    baseline: Attempt,
    shield: Attempt,
    control: z.string(),
  })
  .strict();

export const Metric = z
  .object({
    name: z.string(),
    value: z.number(),
    unit: z.string(),
    n: z.number().int(),
    group: z.enum(["latency", "leakage", "integrity", "defense"]),
  })
  .strict();

export const AuditResult = z
  .object({ invariant: z.string(), status: z.enum(["pass", "fail"]), detail: z.string() })
  .strict();

export const Run = z
  .object({
    id: z.string(),
    mode: z.enum(["baseline", "shield", "both"]),
    status: z.enum(["pending", "running", "finished", "failed"]),
    started_at: z.string().datetime(),
    finished_at: z.string().datetime().nullable(),
    dataset_hash: Hex,
    model_hash: Hex,
    policy_version: z.string(),
  })
  .strict();

export type AppEventT = z.infer<typeof AppEvent>;
// ...export the other inferred types the same way.
```

Every `fetch` and every SSE message passes through the matching schema. On failure: log in dev, show an error state in the UI, and never render the invalid object.

---

## 8. Authentication and authorization (UI side)

- Auth state comes from `GET /auth/me` (TanStack Query). No token handling in JavaScript; cookies are managed by the browser.
- A `RequireRole` route guard redirects to `/login` on `401` and shows a "Not permitted" page on `403`.
- A single `apiFetch` wrapper: sends `credentials: "same-origin"`, adds `X-CSRF-Token` (read from the `csrf` cookie) to state-changing calls, validates responses with Zod, and maps errors to the contract's error shape.
- On `401` anywhere: clear cached data, close the SSE stream, redirect to `/login`.
- Login form: no autofill hints that store passwords insecurely, generic failure message, disable the button while submitting, show a lockout message on `429`.
- Re-confirm sensitive actions (hostile Red, reset, tamper) with a modal that states what will happen and requires typing the action name.
- Logout closes all `EventSource` connections.

**Demo accounts** exist only in the mock server and are read from `mock/.env.mock` (copy of `mock/.env.mock.example`, which lists variable names with placeholder values). Never commit real credentials.

| Role | Can do |
|---|---|
| viewer | See topology, events, breach wall, ledger, results, threat model, audit |
| operator | Also start runs, press Verify, launch hostile Red |
| admin | Also reset the environment and use demo tamper controls |

---

## 9. Mock server (`mock/`)

Build this **first**. It must implement section 6 exactly so the real backend can replace it with no UI changes.

Requirements:
- `npm run mock` starts it on a configurable port; Vite dev proxy forwards `/api` to it.
- Implements login with cookies (`session` HttpOnly, `csrf` readable), CSRF checks, roles, `429` after repeated failed logins, and `401` on expired sessions.
- Streams SSE events for both stacks. **Shield** stream: attempted breaches appear as `blocked` or `denied`. **Baseline** stream: the same attempts appear as `allowed`. Normal traffic mixes in `allowed` request and verdict events at a realistic rate (about 2 to 5 per second).
- Maintains an in-memory hash-chained ledger (SHA-256) so Verify genuinely works. `POST /demo/tamper` modifies one entry; `POST /ledger/verify` then reports `first_bad_seq`; `POST /demo/untamper` restores it.
- `POST /runs` creates a run and emits `run` events; `POST /runs/{id}/hostile-red` emits a burst of `breach_attempt` events (blocked on shield, allowed on baseline).
- Serves breach results (14 tests, listed in section 11), metrics and audit results from JSON fixtures in `mock/fixtures/`.
- Every mock number is flagged SIMULATED in the UI via the `MOCK` mode badge.
- Provide a "scenario" fixture switch for audit status: `all-pass` and `one-fail`, so the failing banner can be tested.

---

## 10. Project structure

```
frontend/
├── package.json            (pinned versions)
├── vite.config.ts          (dev proxy: /api -> mock)
├── tailwind.config.ts      (design tokens)
├── src/
│   ├── api/                (apiFetch, schemas.ts, hooks, sse.ts)
│   ├── components/         (Topology, PacketLayer, BreachCard, LedgerChain, StatCard, EventTable, RoleGuard, ...)
│   ├── pages/              (Login, Topology, Events, Breach, Compare, Ledger, Results, Runs, ThreatModel, Audit)
│   ├── state/              (zustand stores)
│   ├── styles/             (tokens.css, fonts import)
│   ├── lib/                (format, truncateHash, a11y helpers)
│   └── main.tsx
├── mock/
│   ├── server.ts
│   ├── fixtures/           (breach.json, metrics.json, audit.all-pass.json, audit.one-fail.json)
│   └── .env.mock.example
├── tests/
│   ├── unit/
│   └── e2e/                (Playwright)
└── docs/                   (contract.md, FRONTEND_BRIEF.md, ASSUMPTIONS.md, CONTRACT_CHANGES.md)
```

Environment flags (`.env.example`, names only, no secrets): `VITE_API_MODE=mock|live` (controls the badge and the "SIMULATED" tags) and `VITE_API_BASE=/api`.

---

## 11. Breach test list (fixture content and Breach Wall data)

| ID | Test | Baseline | Shield | Control |
|---|---|---|---|---|
| B01 | Blue reads Red's payload directory | succeeded | blocked | Per-cell mounts |
| B02 | Red connects directly to Blue | succeeded | blocked | Separate internal networks |
| B03 | Any cell reaches the internet | succeeded | blocked | Internal-only networks |
| B04 | DNS exfiltration attempt | succeeded | blocked | No external DNS |
| B05 | Forbidden syscall (ptrace, mount, unshare) | succeeded | blocked | seccomp / sandbox runtime |
| B06 | Write to root filesystem | succeeded | blocked | Read-only root FS |
| B07 | Evaluator opens a network socket | succeeded | blocked | `network_mode: none` |
| B08 | Evaluator persists a payload | succeeded | blocked | tmpfs wipe, read-only FS |
| B09 | Forged or expired token | n/a | blocked | Signature and expiry check |
| B10 | Replayed token or exceeded budget | n/a | blocked | Nonce store and query budget |
| B11 | Mount or reach Docker socket | succeeded | blocked | Not mounted, no privileges |
| B12 | Tamper with a ledger entry | succeeded | blocked | Hash chain detects it (verify fails) |
| B13 | Cross-tenant cache timing probe | succeeded | blocked | Cache isolation and timing padding |
| B14 | Canary scan across observable surfaces | succeeded | blocked | All of the above (0 crossings) |

Note for the UI: for B12 and B13 the honest wording of "blocked" is "detected" or "not distinguishable". Use a per-test `shield_label` override in the card text when helpful ("DETECTED", "NOT DISTINGUISHABLE").

---

## 12. Threat Model page content

**Protects against:** cross-team visibility of payloads and defense logic; network snooping and lateral movement; log tampering and forged findings; cache, context and session contamination; noisy-neighbor and resource interference.

**Not fully covered:** host-kernel or hypervisor zero-days; hardware side channels on shared CPUs or GPUs; a malicious cloud operator; compromise of the Broker or signing key; slow oracle probing through allowed queries; truncation of the newest ledger entries without an external anchor.

**Roadmap:** confidential VMs and TEEs (AMD SEV-SNP, Intel TDX); dedicated GPU or MIG slice per tenant; formal verification of Broker policy; multi-party ledger signing and a public transparency log; limits on verdict queries.

**Guarantees may fail if:** policy is misconfigured, the host is heavily shared, or a signing key leaks.

Closing line (displayed prominently): *"We don't just run safety tests. We make sure the tests can be trusted."*

---

## 13. Security checklist (frontend and proxy)

| Item | Requirement |
|---|---|
| XSS | No `dangerouslySetInnerHTML`; all fields rendered as text |
| CSP | Strict same-origin policy set by the reverse proxy: `default-src 'self'`; no inline scripts; `connect-src 'self'`; `frame-ancestors 'none'`. This is why fonts and icons are self-hosted. |
| CSRF | `SameSite=Strict` cookies plus `X-CSRF-Token` on state-changing requests |
| CORS | Same-origin only; no wildcard origins |
| Cookies | `HttpOnly; Secure; SameSite=Strict` for the session |
| Headers | `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, HSTS when TLS is on |
| Rate limiting | Login attempts limited (server side); UI handles `429` |
| Secrets | None in the repo, bundle or `localStorage`; `.env` files git-ignored except `.example` |
| Dependencies | Pinned; `npm audit` clean or each finding documented |
| Metadata-only | A test that fails if any event or ledger `meta` field looks payload-like (see section 14) |
| Telemetry | No analytics or third-party requests |
| Logging | `console` output never prints event bodies in production builds |

The proxy config itself (headers, TLS, hardening flags) is built on the backend side. Provide a `docs/proxy-requirements.md` listing exactly the headers the frontend expects.

---

## 14. Tests required

**Unit (Vitest):**
- Every Zod schema accepts a valid fixture and rejects: an extra `payload` field, a bad enum, a bad timestamp.
- `truncateHash` and formatters.
- `apiFetch` adds the CSRF header on `POST` only and maps `401`, `403`, `429` and `5xx` correctly.
- Event store keeps at most 2,000 events.

**End-to-end (Playwright, against the mock):**
1. Login success, login failure (generic message), lockout on repeated failures.
2. Role gating: viewer cannot see Run Control actions or Verify; operator can Verify; admin sees the tamper controls.
3. Topology: an `allowed` event animates through; a `blocked` event stops at the boundary and shows the lock.
4. Breach Wall: all 14 cards render; the baseline column shows SUCCEEDED and the shield column shows BLOCKED.
5. Baseline vs Shield: pressing "Run same attack" produces different outcomes in the two columns.
6. Ledger: Verify returns OK; after Tamper, Verify fails at the correct block and later blocks show "chain broken"; Restore returns it to OK.
7. Audit: `one-fail` fixture turns the banner red and names the failing invariant.
8. **Metadata-only guard:** a mock event containing a forbidden field (such as `payload` or `prompt`) is rejected and never appears in the DOM.
9. Backend-down state: stopping the mock shows the error state with Retry and, on Results, offers to load a saved snapshot.
10. Logout closes SSE streams and returns to the login page.

**Quality gates before a milestone is complete:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run e2e` all pass.

---

## 15. Milestones (do in order)

| M | Scope | Done when |
|---|---|---|
| **F1** | Scaffold, tokens, fonts, layout shell, router, `apiFetch`, Zod schemas, `docs/` files | App builds; shell renders with correct palette and fonts; schema unit tests pass |
| **F2** | Mock server with auth, CSRF, SSE, ledger, runs, fixtures | Every endpoint in section 6 responds per contract; mock tests pass |
| **F3** | Login, role guard, session handling | E2E tests 1, 2, 10 pass |
| **F4** | Event store + Event Feed + Live Topology with animated packets | E2E test 3 passes; stays smooth with 5 events per second |
| **F5** | Breach Wall + Baseline vs Shield | E2E tests 4 and 5 pass |
| **F6** | Ledger Explorer with Verify, Tamper and Restore | E2E test 6 passes |
| **F7** | Results and Metrics, snapshot export and load, Audit Status, Threat Model, Run Control | E2E tests 7 and 9 pass |
| **F8** | Security hardening pass, accessibility pass, reduced motion, projector readability, README | Checklist in section 13 verified; E2E test 8 passes |
| **F9** | Switch to live mode against the real Dashboard API; fix any contract mismatches | All screens work with `VITE_API_MODE=live`; mismatches recorded in `docs/CONTRACT_CHANGES.md` |
| **F10** | Freeze: no new features; record a demo video; save a results snapshot JSON | Full demo script runs end to end without errors |

**If time runs short, cut in this order:** Run Control polish, Threat Model extras, Likelihood x Impact table, animations beyond the basic packet movement. **Never cut:** Login and roles, Live Topology, Breach Wall, Baseline vs Shield, Ledger Explorer with Verify and Tamper, Results, and the metadata-only guard.

---

## 16. Prompts to paste into Antigravity (one per milestone)

**Before F1:** "Read `docs/FRONTEND_BRIEF.md` fully. Summarize the rules in section 2 and the milestone list in section 15 in your own words, list any assumptions you plan to make, and wait for my approval before writing code."

**F1:** "Implement milestone F1 from the brief: scaffold React + Vite + TypeScript with Tailwind using the section 4 tokens, self-hosted fonts, the layout shell with routing, the `apiFetch` wrapper, and `src/api/schemas.ts` exactly as in section 7. Add the schema unit tests from section 14. Pin exact dependency versions. Run lint, typecheck and tests, and show me the results."

**F2:** "Implement milestone F2: the mock server in `mock/` that follows section 6 exactly, including cookies, CSRF, roles, `429` lockout, SSE for both stacks, an in-memory SHA-256 hash-chained ledger with working tamper, verify and restore, runs, hostile-red bursts, and fixtures for breach, metrics and audit (all-pass and one-fail). Provide `npm run mock`. Do not touch frontend pages yet."

**F3:** "Implement milestone F3: login page, session handling via `/auth/me`, `RequireRole` guard, logout that closes SSE, and the E2E tests 1, 2 and 10 from section 14."

**F4:** "Implement milestone F4: the SSE event store (max 2,000 events, schema-validated, rejects unknown fields), the Event Feed, and the Live Topology with animated packets as specified in 5.2 and 5.3. Respect `prefers-reduced-motion`. Add E2E test 3."

**F5:** "Implement milestone F5: the Breach Wall (5.4) and Baseline vs Shield (5.5) with the red-to-green flip animation. Add E2E tests 4 and 5."

**F6:** "Implement milestone F6: Ledger Explorer (5.6) with Verify, demo-only Tamper and Restore (admin, confirmation modal), and the broken-chain display. Add E2E test 6."

**F7:** "Implement milestone F7: Results and Metrics with JSON snapshot export and load, Audit Status, Threat Model (content from section 12), and Run Control (5.8). Add E2E tests 7 and 9."

**F8:** "Do a hardening pass against the section 13 checklist: confirm no `dangerouslySetInnerHTML`, no external requests, no tokens in storage, CSRF header on all mutations, `npm audit` reviewed. Do an accessibility pass (focus rings, contrast, semantic markup) and a projector-readability pass. Add E2E test 8 and write the README with mock mode, live mode and test commands."

**F9:** "Switch `VITE_API_MODE` to live against the real Dashboard API at the base URL I give you. Fix every contract mismatch on the frontend side only, and record each one in `docs/CONTRACT_CHANGES.md`. Do not change backend code."

**F10:** "Freeze features. Verify the full demo script (Baseline attacks succeed, Shield blocks them, hostile Red, ledger tamper and verify failure, canary counter, results) runs cleanly in both mock and live mode, and export a results snapshot JSON."

---

## 17. Demo script the UI must support (about 4 minutes)

1. **Compare** screen: press "Run same attack". Baseline shows attacks succeeding; Shield shows the same attacks blocked.
2. **Topology**: normal attack-and-defend traffic flows live; point out there is no Red-to-Blue link.
3. **Breach Wall**: all tests flip from red to green, each with the control that stopped it.
4. **Run Control**: launch the hostile Red script and watch every attempt stop at its boundary.
5. **Ledger Explorer**: Tamper one block, press Verify, and show it fail at that exact block. Restore it.
6. **Results**: canary crossings at 0 across N runs, latency overhead, timing-leak result, tamper detection.
7. **Threat Model**: close on the honest limits and the closing line.

---

## 18. Definition of done (whole frontend)

- All P0 screens work in mock mode and live mode with `VITE_API_MODE` switched, without code changes.
- All Playwright tests, unit tests, lint and typecheck pass.
- No payload-like field can reach the DOM (test 8 proves it).
- No external network requests at runtime (verified in the browser's network panel).
- A saved results snapshot lets the Results page render with the backend offline.
- The README explains setup, mock mode, live mode and tests in under a page.
- Every simulated number is clearly labelled in mock mode.
