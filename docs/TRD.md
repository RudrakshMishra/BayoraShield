# BayoraShield — Technical Requirements Document (TRD) v2

Status: v2.0, 2026-10-28 (rewritten after reading the two design-chat documents)
Sources, in order of authority:
1. **SPEC** = chat document "BayoraShield Prototype: Complete Build Specification" (backend, infra, tests, metrics). Save it as `docs/chat/BUILD_SPEC.md`.
2. **PLAN2** = chat document "BayoraShield: Two-Person Build Plan (Claude Code + Antigravity)" (scope cuts, ownership, milestones M1–M6). Save it as `docs/chat/TWO_PERSON_PLAN.md`.
3. **BRIEF** = `BAYORASHIELD_ANTIGRAVITY_BRIEF.md` in the repo (frontend, the `/api/*` Dashboard API contract, Zod schemas, screens, tests, milestones F1–F10).
Where SPEC/PLAN2 and BRIEF overlap, BRIEF wins for anything the browser sees (`/api/*`, schemas, UI); SPEC/PLAN2 win for everything behind the Dashboard API.

Tags: **[CHAT]** = decided in SPEC/PLAN2. **[A-nn]** = my assumption, listed in section 18; Claude Code must copy section 18 into `docs/ASSUMPTIONS.md` in Phase 0 and ask the team only if an assumption blocks work. **[VERIFY]** = check against the repo.

## 1. Architecture overview
```
                 net_front (reverse proxy + Dashboard API only; no cell network)
 Browser ──► Reverse proxy ──► Dashboard API ───────────────────────────┐
                                  │ net_ctrl (read-only metadata)        │
 ┌──────────┐ net_red  ┌──────────▼───────────┐ net_model ┌──────────┐   │
 │ Red cell ├─────────►│     POLICY BROKER    ├──────────►│Model cell│   │
 └──────────┘          │ (only multi-network  │           │llama.cpp │   │
                       │  container)          │           └──────────┘   │
                       └──┬──────┬─────────┬──┘                          │
        Unix socket (vol) │      │ net_ctrl│ net_ledger                  │
        mounted in ONLY   │      │         │                             │
        Broker + Blue     │  ┌───▼────┐ ┌──▼───────────────┐             │
 ┌────────────────────┐   │  │ Redis  │ │ Ledger service   │◄── read-only┘
 │ Blue sealed        │◄──┘  │ (OPA*) │ │ (signs, chains)  │    GET listener (A-01)
 │ evaluator          │      │ Meta PG│ │ + Ledger Postgres│
 │ network_mode: none │      └────────┘ └──────────────────┘
 └────────────────────┘     * OPA optional, deferred
```
Baseline stack (separate compose file): one shared network, a shared volume, plain Docker, no Broker enforcement, same cells (section 5.4).

Trust boundaries [CHAT]: Red, Blue and Model are mutually untrusted. The Broker is trusted for routing but **cannot rewrite history**: the Ledger service alone holds the ledger signing key. The Dashboard API is read-mostly and never sees payloads. The browser is untrusted. The operator (human) sees ledger metadata read-only; plaintext only after a test ends, if kept.

## 2. Components
| Component | Responsibility | Must never |
|---|---|---|
| Red cell (`services/red`) | Attack runner (prompt subsets, hostile escape script) | See Blue rules or which rule fired; reach Blue/Model/internet directly |
| Blue sealed evaluator (`services/blue`) | Classifier + rule layer on inputs, blind output filter; returns only `allow` or `block` | Open a socket, persist a payload, send anything except the verdict |
| Model cell (`services/model`) | `llama-server` (llama.cpp) serving a small GGUF model | Be reachable except through the Broker |
| Policy Broker (`services/broker`) | Sessions, Ed25519 capability tokens, scope/policy check, Redis budgets and nonces, salted payload hashing, pipeline, timing padding, metadata stripping, event stream | Log payload text; sign ledger entries; be bypassed |
| Ledger service (`services/ledger`) + Ledger Postgres | Append-only, hash-chained, Ed25519-signed store; read-only GET listener | Accept appends from anything but the Broker; expose the signing key |
| Redis 7 | Atomic budget counters and nonce store | Hold payloads |
| Metadata Postgres | Run metadata, results, metrics (separate from the ledger zone) | Hold payloads |
| OPA (optional, deferred) | Rego policy queried by the Broker | — |
| Dashboard API | The `/api/*` contract from BRIEF §6, bridging to Broker events, results store, ledger reads, run control, demo controls | Expose payload content; let the browser reach any other service |
| Reverse proxy | TLS option, CSP and headers, serves the built frontend and proxies `/api` | Allow cross-origin or inline scripts |
| `bayora-verify` (`tools/bayora-verify`) | CLI ledger verifier (shared library with the API verify endpoint) | Modify the ledger |
| `bayora-audit` | Script that inspects running containers and fails when any isolation rule is broken | Modify the stack |
| Test harness (`tests/breach`, `tests/canary`, `tests/stats`) | Breach suite, canary scan, latency/timing/tamper statistics | Run against anything but the lab stacks |

## 3. Environment and technology [CHAT]
**Host:** native Linux (Ubuntu 22.04 or 24.04), ideally a cloud VM; 4 vCPU, 16 GB RAM, 60 GB disk, no GPU. Docker Engine + Compose v2. Windows/macOS Docker Desktop cannot run gVisor/Falco; fallback is WSL2 or a cloud VM, with the hardening flags in section 5.2 and gVisor shown as roadmap. Run Claude Code on that VM; **no personal credentials or real API keys on it**; read every diff before committing.
**Pin every version on day one** (`docs/VERSIONS.md`) and **check current releases first**; the chat's knowledge of exact versions may be outdated.

| Layer | Choice |
|---|---|
| Services language | Python 3.12 |
| Broker | FastAPI + Uvicorn, httpx, pydantic |
| Policy | In-code rules first; OPA (Rego) container only if time remains |
| Tokens | Ed25519-signed capability tokens (PyNaCl or `cryptography`) |
| Transport auth | mTLS deferred (tokens first) |
| Budgets / replay | Redis 7 |
| Ledger store | Separate Postgres 16 with triggers blocking UPDATE and DELETE |
| Run metadata / metrics | Second Postgres (or separate schema) in `net_ctrl` |
| Ledger crypto | SHA-256 hash chain + Ed25519 signatures (Merkle root optional) |
| External anchor | Signed entry count, plus a commit of the head hash to a GitHub repo if time allows; OpenTimestamps deferred |
| Model server | `llama.cpp` `llama-server`, 1–3B instruct GGUF Q4 on CPU (Qwen2.5-1.5B-Instruct or Llama-3.2-1B/3B), output capped at 64–128 tokens. Check the model licence. A deterministic stub is used in unit tests |
| Blue classifier | Small prompt-injection/jailbreak classifier + rule layer on `onnxruntime` or `transformers` (CPU). Check the licence of the chosen model |
| Secrets | Docker secrets; `age` for per-team plaintext encryption (Vault dev mode optional, cut) |
| Monitoring | Custom violation reporter + Docker events (Falco deferred) |
| Frontend | React + Vite + TypeScript + Tailwind + Recharts, SSE (BRIEF §3, unchanged) |
| Testing | pytest, `docker compose` test profile, scipy (KS test); Vitest + Playwright for the frontend |
| CI (optional) | GitHub Actions: lint and unit tests |
| Build tooling | `Makefile`: `make up / down / test / audit / breach / verify / demo` |

## 4. Repository layout [CHAT, adapted: A-07]
```
BayoraShield/
├── CLAUDE.md  README.md  Makefile
├── BAYORASHIELD_ANTIGRAVITY_BRIEF.md         (also docs/FRONTEND_BRIEF.md)
├── docker-compose.baseline.yml
├── docker-compose.shield.yml
├── services/ broker/ ledger/ red/ blue/ model/ dashboard-api/
├── frontend/                 (existing; = chat's services/dashboard; contains mock/)
├── policy/                   (Rego, only if OPA is built)
├── security/                 (seccomp profiles, AppArmor, cert scripts)
├── tests/ breach/ canary/ stats/
├── tools/bayora-verify/      (+ bayora-audit)
├── data/                     (prompt subsets; gitignore if large)
├── results/ snapshots/
└── docs/ PRD.md MRD.md TRD.md IMPLEMENTATION_PLAN.md STATUS.md contract.md
         ASSUMPTIONS.md CONTRACT_CHANGES.md VERSIONS.md proxy-requirements.md
         threat-model.md chat/ (BUILD_SPEC.md, TWO_PERSON_PLAN.md)
```

## 5. Network and container design
### 5.1 Networks (shield stack; all `internal: true`, no internet) [CHAT]
| Network | Members |
|---|---|
| `net_red` | Red cell, Broker |
| `net_model` | Model cell, Broker |
| `net_ledger` | Ledger service, Ledger Postgres, Broker |
| `net_ctrl` | Broker, Redis, metadata Postgres, (OPA), Dashboard API; Ledger service read-only listener (A-01) |
| `net_front` | Reverse proxy, Dashboard API (never a cell network; internal networks cannot publish ports) |
| `net_blue` | **Not created** (A-02): the chat lists it, but also requires the evaluator to have no network. The invariant wins. |
The Broker is the only container bridging cell networks. There is no route between cells.

### 5.2 Hardening for every container [CHAT]
`cap_drop: [ALL]`, `read_only: true`, `security_opt: [no-new-privileges:true, seccomp=<profile>]`, `pids_limit`, `mem_limit`, `cpus`, `cpuset` (pinning), non-root `user`, no Docker socket mounted, never `privileged`. `runtime: runsc` (gVisor) only if it works on the VM in the first session. Choose **either** rootless Docker/Podman **or** gVisor with `userns-remap`, test the combination early, and document the choice.

### 5.3 Blue sealed evaluator [CHAT]
`network_mode: none` (no interface at all). It talks to the Broker over a **Unix domain socket** on a volume mounted into only those two containers. Read-only root FS, small `tmpfs` scratch wiped after each request. It computes on a payload but cannot keep or send it; it returns only `allow` or `block`. This resolves the earlier open question about how a no-network evaluator is driven; build and test it first (T3.1).

### 5.4 Baseline stack [CHAT]
`docker-compose.baseline.yml`: one Docker network, a shared volume, default capabilities, writable root FS, plain setup, no Broker enforcement. Clearly labelled as a comparison fixture, never exposed beyond the lab. A minimal event emitter posts events in the BRIEF event schema so the dashboard can show the Baseline stream (A-05).

## 6. Policy Broker [CHAT]
Endpoints (internal API): `POST /v1/session` (a cell authenticates and receives a capability token), `POST /v1/infer` (Red's attack path), `GET /v1/health`, `GET /v1/events` (SSE, metadata only).
Token claims: `sub` (cell id), `sid` (session id), `scope` (e.g. `model:infer`), `budget` (max calls), `exp` (short), `nonce`; signed Ed25519.
Pipeline:
1. Red presents token.
2. Broker verifies signature, expiry, scope; consults policy (in-code first, OPA later); checks and decrements the Redis budget; records the nonce.
3. Broker hashes the payload (salted per run) and asks the Ledger to append.
4. Broker sends the prompt to Blue's sealed evaluator over the socket; verdict returns.
5. If allowed, the Broker calls the Model cell.
6. The response passes Blue's output filter (blind again); the Broker strips metadata, pads timing, and returns **only the outcome** to Red.
7. Every step is appended to the ledger and emitted as an `AppEvent`.
Status codes [CHAT]: forged/expired token → 401; replayed token → rejected; exceeded budget → 429. Red only ever receives an outcome (`allowed`/`blocked`/`denied`), never which rule fired.
Timing and cache defense: `llama-server` prompt caching disabled for cross-tenant traffic, or one slot/instance per tenant; pad responses to fixed latency buckets with jitter; the **true** latency is written to the ledger.
Logging: metadata only.

## 7. Ledger [CHAT]
Entry stored in Ledger Postgres: `{seq, ts, cell, action, payload_hash, policy_version, model_hash, prev_hash, entry_hash, sig}`.
- `entry_hash = SHA256(prev_hash || canonical_json(entry without entry_hash and sig))`; canonical JSON = sorted keys, no whitespace, UTF-8.
- Only hashes are stored. Plaintext payloads, if kept at all, are encrypted with the owning team's `age` key and released after the test.
- **The Ledger service holds the signing key**; the Broker and cells have an append-only credential and cannot rewrite history. Postgres triggers block UPDATE and DELETE for the application role.
- Genesis: `seq = 0`, `prev_hash = 64 × "0"`.
- Ledger API: `POST /append` (Broker only), `GET /head`, `GET /entries?from=&to=`. The Dashboard API maps these to BRIEF `/ledger/head`, `/ledger/entries`, `/ledger/verify`. `policy_version` and `model_hash` appear in the API `LedgerEntry.meta` (A-04).
- `bayora-verify` checks: chain continuity, signatures, sequence gaps, and head hash vs the external anchor. It catches edits, mid-chain deletions, insertions and reordering. **Truncating the newest entries is detectable only via the anchor or a signed entry count**; say so in the threat model and in the UI (BRIEF 5.7).
- Demo tamper (A-03): because DB triggers block normal edits, the demo-only control uses a separate demo-admin DB role (exists only when `DEMO_MODE=true`) to disable the trigger, edit one row, and save the original; `untamper` restores it. Honest wording in the UI/docs: triggers stop the application role; verification catches edits made by anyone with DB-owner access.

## 8. Visibility matrix [CHAT]
| Artifact | Red | Blue | Model | Broker | Operator (human) |
|---|---|---|---|---|---|
| Red payload source | Yes | No | Prompt only | In memory | After test ends |
| Blue classifier weights and rules | No | Yes | No | No | After test ends |
| Verdict reason / rule fired | No | Yes | No | Verdict only | After test ends |
| Model weights and cache | No | No | Yes | No | Yes |
| Ledger | Write only | Write only | Write only | Write only | Read-only, metadata |

## 9. Dashboard API and frontend
- Implements BRIEF §6 exactly (auth, SSE `/events?stack=`, ledger, results, runs, hostile-red, reset, demo, errors) behind the reverse proxy on `net_front`.
- Sources: shield events from Broker `/v1/events`; baseline events from the baseline emitter (A-05); breach/metrics/audit from the results store; ledger via the Ledger read-only listener (A-01); runs trigger the harness.
- Every response model forbids extra fields; SSE closes on session expiry; CSRF, roles, login rate limit per BRIEF §6.1 and §8.
- Demo accounts only when `DEMO_MODE=true`, from environment, never committed.
- Frontend per BRIEF (screens §5, tokens §4, schemas §7, auth §8, mock §9, tests §14, milestones F1–F10). PLAN2's minimum dashboard (live topology, Breach Wall, Ledger, plus split-screen Baseline-vs-Shield) is the floor if time runs short. Use Claude Code for the frontend work instead of Antigravity (A-06).

## 10. Evaluation
### 10.1 Breach suite (same 14 tests as BRIEF §11) [CHAT]
Runs each test in Baseline and Shield; results written as `BreachResult {test_id, name, attempt, baseline, shield, control}`.
| # | Attempt | Baseline | Shield | Control |
|---|---|---|---|---|
| B01 | Blue reads Red's payload directory | Succeeds | No such path | Per-cell mounts |
| B02 | Red connects directly to Blue | Succeeds | Unresolvable / refused | Separate networks |
| B03 | Any cell reaches the internet | Succeeds | Unreachable | `internal: true` |
| B04 | DNS exfiltration | Succeeds | Fails | No external DNS |
| B05 | Forbidden syscall (ptrace, mount, unshare) | Succeeds | Denied | seccomp (gVisor if used) |
| B06 | Write to root filesystem | Succeeds | Read-only error | `read_only` |
| B07 | Evaluator opens a socket | Succeeds | No interface | `network_mode: none` |
| B08 | Evaluator persists the payload | Succeeds | Wiped / read-only | tmpfs reset |
| B09 | Forged or expired token | n/a | 401 | Signature check |
| B10 | Replayed token / exceeded budget | n/a | Rejected / 429 | Nonce + Redis |
| B11 | Reach Docker socket / privileged escalation | Succeeds | Not mounted | Hardening flags |
| B12 | Tamper with a ledger entry | Undetected | Verify fails at that block (DETECTED) | Hash chain |
| B13 | Cross-tenant cache timing probe | Distinguishable | Not distinguishable | Cache isolation + padding |
| B14 | Canary scan | Canaries leak | Zero crossings | All of the above |
Rule from PLAN2: write breach tests early; they must fail on Baseline and pass on Shield, which makes progress visible.

### 10.2 Hostile Red
A one-button escape script (`POST /runs/{id}/hostile-red`) that attempts every route above while the topology shows each attempt failing; safe to re-run, cannot harm the host.

### 10.3 Canaries [CHAT]
Plant `RED-CANARY-<uuid>` in Red's payload store, `BLUE-CANARY-<uuid>` in the classifier config, and a Broker secret canary. After a full run scan everything other teams can observe: responses, logs, dashboard feed, metrics and the ledger. A crossing is any match outside the owner. The harness stores canary hashes, not values.

### 10.4 Metrics [CHAT]
| Metric | Method | Honest target |
|---|---|---|
| Canary crossings | Scan all observable surfaces | 0 across N runs (state N) |
| Breach tests blocked | 10.1 table | All pass on Shield |
| Isolation overhead | p50 and p95 latency, Baseline vs Shield, 200+ requests | Report what is measured |
| Timing leakage | KS test on latency distributions, or a simple classifier's AUC before vs after mitigation | AUC near 0.5 after |
| Tamper detection | Edit, delete, insert, reorder, truncate | 100% for the first four; truncation only with the anchor |
| Defense quality | Block rate on an attack subset plus a benign set for false positives | Report both |
Datasets: 100–200 attack prompts from JailbreakBench, AdvBench, HarmBench and the Gandalf set, plus 50–100 benign prompts. Keep the subset fixed and record it in the ledger. Check each dataset's licence/terms. Prompt content is never shown in the UI.
Reproducibility record per run: model SHA-256 before and after, container image digests, config, seed, policy version, OPA bundle hash (if used). The BRIEF `Run` fields (`dataset_hash`, `model_hash`, `policy_version`) are a subset (A-08); the rest lives in the metadata Postgres.

## 11. Audit and verification tools
`bayora-audit` (build first, in M1) inspects running containers from the host and fails on any violation: privileged mode, capabilities not dropped, writable root FS, docker.sock mounted, any non-internal network, a cell on more than one network (Broker excepted), evaluator with a network interface, shared volumes between cells (except the Blue–Broker socket volume), missing seccomp profile, missing resource limits, root user. It must have a test that deliberately breaks one rule. Output serves `GET /audit/latest` (BRIEF `AuditResult`).
`bayora-verify` is the ledger verifier (section 7) with tests for edit, delete, insert, reorder and truncation behavior.

## 12. Security requirements
BRIEF §13 applies unchanged. Backend additions [CHAT/PLAN2 pitfalls]:
- Treat every compose and Dockerfile change as untrusted until `bayora-audit` and the breach tests pass; plausible-but-wrong security config is the main AI-assisted risk.
- Do not claim a protection unless a test shows it.
- Pin versions; no agent-installed package you have not looked at; `pip-audit` and `npm audit` reviewed.
- Secrets in Docker secrets or environment, never in git; `.env.example` has names only.
- Metadata-only guard at three layers: Zod `.strict()` (browser), `extra="forbid"` (API), and a test scanning events and ledger `meta` for payload-like fields.
- Proxy requirements in `docs/proxy-requirements.md`: `Content-Security-Policy: default-src 'self'; connect-src 'self'; frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, HSTS when TLS is on, SSE buffering off.

## 13. Testing and workflow
| Level | Tooling | Covers |
|---|---|---|
| Unit | pytest (+ hypothesis for the ledger) | tokens, budgets, replay, policy default-deny, ledger append/verify per mutation type, pipeline against stub ledger/model |
| Frontend unit and e2e | Vitest, RTL, Playwright (BRIEF §14) | schemas, `apiFetch`, 10 e2e scenarios on mock, then live |
| Contract | script | live Dashboard API responses validate against the Zod schemas |
| Isolation/system | pytest + `docker compose` test profile | B01–B14 on both stacks; `bayora-audit` green on Shield and red on a deliberate break |
| Statistics | scipy | KS / AUC on timing, latency percentiles |
| Demo rehearsal | scripted | the demo in PRD §10, mock and live |
Rules [CHAT]: write the test first, then the code; run `make test` and `make audit` before calling a task done; commit after each green step; review each Dockerfile/compose change as its own task.

## 14. Configuration
`VITE_API_MODE=mock|live`, `VITE_API_BASE=/api`; `DEMO_MODE`; secrets via Docker secrets or env: `LEDGER_SIGNING_KEY` (Ledger service only), `TOKEN_SIGNING_KEY` (Broker only), `SESSION_SECRET`, DB credentials, `age` public keys. Names only in `.env.example`.

## 15. Risks and fallbacks [CHAT]
| Risk | Fallback |
|---|---|
| gVisor will not install or run | Hardening flags + seccomp; gVisor as roadmap |
| Falco unsupported on host | Custom violation reporter + Docker events |
| Model too slow on CPU | Smaller model, shorter outputs, fewer test prompts |
| mTLS takes too long | Signed tokens only; mTLS as next step |
| Rootless plus gVisor conflict | Pick one and document |
| Demo environment fails | Pre-recorded video and saved test output |
| Contract drift | Tell the team the same day, update the mock, log in `docs/CONTRACT_CHANGES.md` |

## 16. Residual risks to state openly [CHAT]
Host-kernel or hypervisor zero-days; hardware side channels on shared CPUs; a malicious cloud operator; a compromised Broker or signing key; slow oracle probing through allowed queries. This is a proof of concept on standard infrastructure; confidential VMs and dedicated GPUs are the next step.

## 17. Deferred (roadmap, not built unless time remains) [CHAT]
mTLS, Falco, Grafana/Prometheus, OpenTimestamps, Vault, OPA (start with in-code rules), gVisor (unless it works in the first session), Merkle roots.

## 18. Assumptions made by this document (copy to `docs/ASSUMPTIONS.md`)
| ID | Assumption | Why |
|---|---|---|
| A-01 | The Dashboard API is a separate service on `net_front` + `net_ctrl`; it reads ledger data through a GET-only listener on the Ledger service (no append, no key). | Chat has no Dashboard API service; BRIEF requires `/api/*` and the browser must not reach cells. |
| A-02 | `net_blue` is not created; the evaluator has `network_mode: none`. | Chat lists `net_blue` and also forbids evaluator networking. |
| A-03 | Demo tamper uses a demo-only DB-admin role that disables the trigger, edits one row and restores it. | Chat wants "edit a ledger row, verify fails" while triggers block edits. |
| A-04 | `policy_version` and `model_hash` are DB columns and are exposed in API `meta`. | BRIEF `LedgerEntry` has `meta` but not those fields. |
| A-05 | Baseline stack has a minimal event emitter in the BRIEF event schema. | BRIEF `GET /events?stack=baseline` needs a source; Baseline has no Broker. |
| A-06 | The two-person split (Shashwat, Rudraksh) is the ownership default; Chaitanya's earlier items are reassigned; all work, including the frontend, is executed with Claude Code. | PLAN2 is two-person; the user wants everything done in Claude Code. |
| A-07 | Keep the existing `frontend/` folder and root-level compose files; do not move them. | Repo already has `frontend/`; chat specifies root compose files. |
| A-08 | Extra run metadata (image digests, seed, OPA bundle hash) lives in the metadata Postgres, not in the API `Run`. | Keeps the BRIEF contract unchanged. |
| A-09 | Prompt-subset preparation and block-rate/false-positive measurement belong to the Blue/classifier owner. | Chaitanya's items were not reassigned explicitly in PLAN2. |
