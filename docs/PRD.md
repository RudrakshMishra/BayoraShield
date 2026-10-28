# BayoraShield — Product Requirements Document (PRD) v2

Status: v2.0, 2026-10-28 (rewritten after reading the design chat)
Sources: SPEC (`docs/chat/BUILD_SPEC.md`), PLAN2 (`docs/chat/TWO_PERSON_PLAN.md`), and `BAYORASHIELD_ANTIGRAVITY_BRIEF.md` (frontend). Design detail lives in `TRD.md`; assumptions are numbered A-nn in TRD §18.

## 1. Summary
BayoraShield is a secure isolation layer for adversarial AI safety testing (Hack in Hills '26, Track 04). A Red team attacks, a Blue team defends and a client LLM is evaluated side by side in sealed cells, with a Policy Broker as the only route between them and a signed, hash-chained Ledger recording every action. The strongest way to show it is a **side-by-side proof**: the same attacks run once in a naive shared Docker setup (Baseline, where leaks succeed) and once in BayoraShield (blocked and logged). A dashboard makes the isolation visible and verifiable.
Closing line: *"We don't just run safety tests. We make sure the tests can be trusted."*

## 2. Problem
Leakage between attacker, defender and model (shared files, shared network, shared caches, observable timing, editable logs) silently invalidates safety findings, and teams have no cheap way to prove their environment did not leak.

## 3. Goals
- G1. Sealed cells (Red, Blue sealed evaluator, Model) with a single mediated path (Broker).
- G2. Signed, hash-chained ledger; tampering detected by `bayora-verify` and shown in the UI.
- G3. Baseline vs Shield on the same 14 breach tests: 12 succeed on Baseline (B09 and B10 are n/a there), all 14 blocked or detected on Shield.
- G4. Honest, measured results with sample sizes: canary crossings, isolation overhead, timing leakage, tamper detection, defense quality.
- G5. `bayora-audit` so every later change is checked against the isolation invariants automatically.
- G6. A projector-readable dashboard following the BRIEF's security rules.
- G7. Demo-safe: one-command start, mock mode, saved results snapshot, pre-recorded backup video.
- G8. Reproducible runs (model hash, image digests, config, seed, policy version).

## 4. Judging deliverables [CHAT]
1. Working `docker compose` stack that starts with one command (`make up`).
2. Breach-test runner with a pass/fail table (Baseline fails, Shield passes).
3. Tamper-evident ledger with `bayora-verify`.
4. Metrics: leaks, overhead, timing leakage, tamper detection.
5. Threat model with residual risk and measured numbers.
6. Dashboard showing metadata-only events.
7. Pre-recorded backup demo video.

## 5. Non-goals and deferred
Non-goals: defending against host-kernel/hypervisor zero-days, hardware side channels, a malicious cloud operator, or Broker/signing-key compromise (all stated honestly); production multi-tenant scale, billing, SSO; a new attack library; storing or displaying payload content.
Deferred to roadmap unless time remains [CHAT]: mTLS, Falco, Grafana, OpenTimestamps, Vault, OPA (start with in-code policy rules), gVisor (unless it works on the VM in the first session).

## 6. Users, roles and team
| Persona | App role | Needs |
|---|---|---|
| Judge / evaluator | viewer | See isolation working fast; trust the numbers |
| Safety operator | operator | Start runs, press Verify, launch hostile Red |
| Demo admin | admin | Reset environment, tamper/untamper ledger (demo mode only) |
| Red/Blue team fixtures | not UI users | Work without seeing each other's material |
Team (per PLAN2; ownership is advisory because Claude Code does all work, A-06): **Shashwat** = Model cell, Blue classifier/evaluator, Ledger + Postgres, `bayora-verify`, breach suite, canaries, `bayora-audit`, timing experiment, ledger and threat-model docs. **Rudraksh** = Broker, tokens, Redis budgets, Red runner, compose files, Baseline stack, latency benchmark, dashboard, README, architecture diagram, results slide.

## 7. Functional requirements (P0 = demo-critical, P1 = important)
### 7.1 Isolation platform
| ID | Requirement | Pri |
|---|---|---|
| FR-01 | Red, Blue evaluator and Model run in separate hardened containers; cells attach to at most one internal network; only the Broker bridges networks; no Red–Blue route | P0 |
| FR-02 | Broker is the only path between cells and implements the 7-step pipeline (TRD §6); Red receives only an outcome | P0 |
| FR-03 | Ed25519 capability tokens (`sub, sid, scope, budget, exp, nonce`); forged/expired → 401, replay rejected, budget exceeded → 429; Redis counters and nonces | P0 |
| FR-04 | Ledger service holds the signing key, appends hash-chained signed entries, stores hashes only; Postgres triggers block UPDATE/DELETE; Broker cannot rewrite history | P0 |
| FR-05 | `bayora-verify` and `POST /ledger/verify` check chain continuity, signatures, sequence gaps and the anchor; report first bad `seq` and reason | P0 |
| FR-06 | Blue evaluator: `network_mode: none`, Unix-socket channel to Broker only, read-only FS, tmpfs wiped per request, returns only allow/block | P0 |
| FR-07 | No cell reaches the internet or external DNS or the Docker socket | P0 |
| FR-08 | Cache isolation (no cross-tenant prompt cache or one slot per tenant) and timing padding with jitter; true latency logged | P1 |
| FR-09 | Canary system (`RED-CANARY-<uuid>`, `BLUE-CANARY-<uuid>`, Broker secret canary) with a scan over responses, logs, dashboard feed, metrics and ledger | P0 |
| FR-10 | Baseline stack: one shared network, shared volume, plain Docker, same workload, no enforcement | P0 |
| FR-11 | `bayora-audit` inspects running containers and fails on any isolation violation; has a test that deliberately breaks a rule | P0 |
| FR-12 | Reverse proxy on `net_front` with CSP and security headers | P1 |
| FR-13 | Model cell: `llama-server` with a 1–3B GGUF Q4 CPU model, output capped at 64–128 tokens | P0 |
| FR-14 | Blue classifier + rule layer (CPU) with input check and blind output filter | P0 |
| FR-15 | `make up / down / test / audit / breach / verify / demo` | P0 |
| FR-16 | Per-run reproducibility record (model SHA-256 before/after, image digests, config, seed, policy version, OPA bundle hash if used) | P1 |
### 7.2 Dashboard API (BRIEF §6)
| ID | Requirement | Pri |
|---|---|---|
| FR-20 | Auth with `HttpOnly` session cookie, CSRF cookie + header, login rate limit (429) | P0 |
| FR-21 | Roles viewer / operator / admin enforced server-side | P0 |
| FR-22 | `GET /events?stack=` SSE, metadata only, 15 s keep-alive | P0 |
| FR-23 | Ledger head, entries (paged, max 100), verify | P0 |
| FR-24 | Results: breach (14 tests), metrics, audit/latest | P0 |
| FR-25 | Runs create/list/get, hostile-red, reset | P0/P1 |
| FR-26 | Demo tamper/untamper, 404 unless demo mode | P0 |
| FR-27 | Uniform error shape; no internals on 5xx | P0 |
### 7.3 Dashboard UI (BRIEF §5)
| ID | Requirement | Pri |
|---|---|---|
| FR-30 | Login, generic failure, 429 message, redirect back | P0 |
| FR-31 | Live Topology with animated packets; blocked packets stop at the boundary with a lock; no Red–Blue link | P0 |
| FR-32 | Event Feed (virtualized, filters, pause, 2,000 cap, metadata-only banner) | P0 |
| FR-33 | Breach Wall: 14 cards flipping red → green | P0 |
| FR-34 | Baseline vs Shield split screen with "Run same attack" | P0 |
| FR-35 | Ledger Explorer with Verify, demo Tamper/Restore, broken-chain display | P0 |
| FR-36 | Results and Metrics with `n`, JSON snapshot export/load | P0 |
| FR-37 | Run Control incl. one-button "Launch hostile Red" | P1 |
| FR-38 | Threat Model page | P1 |
| FR-39 | Audit Status with red banner on failure | P1 |
| FR-40 | MOCK/LIVE badge, SIMULATED tags, skeletons/empty/error states | P0 |
If time runs short the dashboard floor is: Live Topology, Breach Wall, Ledger, split screen (PLAN2), plus the BRIEF "never cut" items.
### 7.4 Evaluation
| ID | Requirement | Pri |
|---|---|---|
| FR-50 | Breach suite B01–B14 on both stacks (TRD §10.1), failing on Baseline and passing on Shield | P0 |
| FR-51 | Hostile Red escape script | P0 |
| FR-52 | Metrics: canary crossings, p50/p95 overhead (200+ requests), timing leakage (KS or AUC before/after), tamper detection per mutation, block rate and false-positive rate | P0 |
| FR-53 | Datasets: 100–200 attack prompts (JailbreakBench, AdvBench, HarmBench, Gandalf) + 50–100 benign, fixed and recorded in the ledger; licences checked | P1 |

## 8. Non-functional requirements
| ID | Requirement |
|---|---|
| NFR-01 | Security rules of BRIEF §2 and §13 and TRD §12 |
| NFR-02 | Honesty: no claim without a test; truncation of newest ledger entries detectable only with the anchor or signed count; simulated values labelled |
| NFR-03 | Accessibility and projector readability (BRIEF §4, §5.11) |
| NFR-04 | UI smooth at 5 events/s |
| NFR-05 | Overhead reported as measured; no invented targets |
| NFR-06 | Offline demo capability (mock, snapshot, video) |
| NFR-07 | Runs on native Linux (Ubuntu 22.04/24.04), 4 vCPU / 16 GB / 60 GB, no GPU; WSL2 or cloud VM as fallback |
| NFR-08 | Pinned versions, checked against current releases on day one |

## 9. Success metrics (all measured, each with `n`)
- 14/14 breach attempts blocked or detected on Shield; Baseline shows the corresponding attempts succeeding.
- Canary crossings = 0 across N runs.
- Tamper detection 100% for edit, delete, insert, reorder; truncation only with the anchor.
- Timing leakage: AUC near 0.5 after mitigation (report the number and sample size, whatever it is).
- Latency p50/p95 overhead, Baseline vs Shield.
- Attack block rate and false-positive rate.
- `bayora-audit` green on Shield; demo runs end to end without errors in mock and live mode.

## 10. Demo (about 4 minutes)
1. Baseline: run three attacks, all succeed.
2. `make up` starts BayoraShield.
3. Normal attack-and-defend loop with the dashboard live (topology, no Red–Blue link).
4. Breach suite: Breach Wall flips red → green; pass table.
5. "Launch hostile Red": every escape attempt stops at its boundary.
6. Edit one ledger row, run `bayora-verify` (and the UI Verify) and show it fail at that block; restore.
7. Canary counter at 0 beside the number of runs scanned; honest numbers card (overhead, timing result).
8. Threat model, residual risks, closing line.
Backup: pre-recorded video and saved test output.

## 11. Release criteria
All P0 requirements met; quality gates green; `bayora-audit` green on Shield; metadata-only guard proven; no external runtime requests; results snapshot saved; backup video recorded; README and threat model written; versions frozen.

## 12. Open questions
Resolved by the chat: backend stack, evaluator channel (Unix socket), model class, datasets, scope cuts, ownership, milestones.
Still open (ask the user once, in Phase 0):
1. How many days remain before the hackathon deadline, and what is the submission format? (Not found by web search.)
2. Is the demo machine native Linux or a cloud VM? (Decides gVisor and Falco.)
3. Which of BRIEF milestones F1–F10 already exist in `frontend/`? (Claude Code answers this in Phase 0.)
4. Which exact model and classifier, and are their licences acceptable? (Decide in M1 with pinned versions.)
5. Is Chaitanya still on the team? PLAN2 is a two-person plan (A-06).
6. Repository licence.
