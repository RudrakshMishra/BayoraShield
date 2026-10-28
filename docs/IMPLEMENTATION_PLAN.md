# BayoraShield — Implementation Plan v2 (for Claude Code)

Status: v2.0, 2026-10-28 (rebuilt around the chat's milestones M1–M6)
Read `CLAUDE.md` first. IDs: FR/NFR → `PRD.md`; design → `TRD.md` (§n); assumptions A-nn → TRD §18; frontend details → BRIEF (`BAYORASHIELD_ANTIGRAVITY_BRIEF.md`, "brief §n"); chat sources → `docs/chat/BUILD_SPEC.md` (SPEC) and `docs/chat/TWO_PERSON_PLAN.md` (PLAN2).
"Owner" = who owns it per PLAN2 (S = Shashwat, R = Rudraksh). Claude Code does all the work (A-06); if the other person's part already exists in the repo, verify it and mark it done instead of rebuilding.

## 0. Known repo state
Public repo `RudrakshMishra/BayoraShield` had **1 commit** with `docs/`, `frontend/` and the brief at root; no backend, compose files, README or CI were visible at the root. The insides of `docs/` and `frontend/` were not inspectable. Treat the frontend milestones F1–F10 as unverified and the backend as not started until Phase 0 proves otherwise.

## 1. Rules for running this plan
1. Plan mode first. Do **Phase 0** and write `docs/STATUS.md` before anything else.
2. One task ID per session where possible. **Write the test first**, then the code. A task is done only when its "Done when" passes and `make test` and `make audit` are green.
3. Separate branches per owner/track, separate services, and `docs/contract.md` as the only shared file. Never edit the same service in parallel. Merge to `main` at the end of each milestone.
4. Treat every Dockerfile/compose change as untrusted until `bayora-audit` and the breach tests pass; review each as its own task.
5. Commit after each green step with the task ID in the message. Update `docs/STATUS.md` after every task.
6. Do not claim a protection that no test demonstrates. Pin versions and check current releases; do not install packages you have not looked at.
7. Do not change `docs/contract.md` silently: log it in `docs/CONTRACT_CHANGES.md`, tell the team the same day, update the mock.
Effort key: S under half a day, M about a day, L multi-day (relative sizes only).

## 2. Pending work in order (summary)
0. Audit repo, save chat docs, seed assumptions, confirm environment (Phase 0)
M1 Foundation: VM, pinned versions, contract, hardened compose skeleton, `bayora-audit`
M2 Core flow: Ledger + `bayora-verify`, Broker, Model cell, Red runner, end to end
M3 Blind defense: Blue sealed evaluator over the Unix socket, timing/cache defense
M4 Proof: Baseline stack, breach suite, canaries, hostile Red, metrics, results
M5 Dashboard and integration: frontend F1–F8 on mock, Dashboard API, proxy, live switch
M6 Freeze: hardening, rehearsal, numbers, backup video, README and threat model
Then submission pack, and deferred items only if time remains.

## Phase 0 — Orientation (S)
| ID | Task | Done when |
|---|---|---|
| T0.1 | Inventory the repo: list `docs/` and `frontend/`; run install/build/test in `frontend/`; map to F1–F10 and to FR-IDs | `docs/STATUS.md` table: task/milestone → not started / partial / done, with evidence |
| T0.2 | Save the two chat docs as `docs/chat/BUILD_SPEC.md` and `docs/chat/TWO_PERSON_PLAN.md` (if the user has not); copy the brief to `docs/FRONTEND_BRIEF.md` | Files exist |
| T0.3 | Create `docs/ASSUMPTIONS.md` seeded from TRD §18 (A-01…A-09) and `docs/CONTRACT_CHANGES.md` | Files exist; any new conflict with the chat is appended |
| T0.4 | Collect the open questions in PRD §12 that the repo cannot answer and ask the user **once**, in one short message (days left, submission format, native Linux or cloud VM, Chaitanya, licences) | Answers recorded in STATUS |

## M1 — Foundation
| ID | Owner | Task | Done when |
|---|---|---|---|
| T1.1 | S | Prepare the Linux VM (Ubuntu 22.04/24.04, 4 vCPU/16 GB/60 GB): Docker Engine + Compose v2, Python 3.12, Node; check **current** releases of every dependency, model and tool; record in `docs/VERSIONS.md` | Versions pinned and recorded |
| T1.2 | S | Timeboxed trial of gVisor (`runsc`) and decide rootless vs gVisor+`userns-remap` (TRD §5.2); if it does not work in the first session, use hardening flags and list gVisor as roadmap | Decision written in ASSUMPTIONS |
| T1.3 | R | Repo layout per TRD §4 (keep `frontend/`, A-07), `.gitignore`, `.env.example` (names only), README skeleton, `Makefile` with `up/down/test/audit/breach/verify/demo` stubs | `make` targets exist and run |
| T1.4 | S+R | Write `docs/contract.md`: Dashboard API (= brief §6), Broker REST (`/v1/session`, `/v1/infer`, `/v1/health`, `/v1/events`), Ledger API (`POST /append`, `GET /head`, `GET /entries?from=&to=`), event schema, results JSON, **ports and networks table** (TRD §5.1) | Contract complete; mock and backend tests can share its fixtures |
| T1.5 | R | `docker-compose.shield.yml` skeleton: networks (TRD §5.1), all hardening flags (TRD §5.2), placeholder services (Broker, Ledger, Red, Model, Blue, Redis, Postgres×2) | `docker compose config` valid; stack starts |
| T1.6 | S | **`bayora-audit`** (TRD §11) with a test that deliberately breaks one rule | Passes on the skeleton; fails with a clear message when a flag is removed |
| T1.7 | R | Optional CI (GitHub Actions: lint + unit tests) | CI green |
M1 done when: VM ready, versions pinned, contract written, networks and hardened compose up, `bayora-audit` passes.

## M2 — Core flow
| ID | Owner | Task | Done when |
|---|---|---|---|
| T2.1 | S | **Ledger service + Ledger Postgres + `bayora-verify`**: append-only via triggers, hash chain, Ed25519 signing inside the Ledger service, `POST /append`, `GET /head`, `GET /entries`; read-only GET listener (A-01) | Tests detect edit, delete, insert, reorder at the right `seq`; truncation behavior documented; Broker credential cannot UPDATE/DELETE |
| T2.2 | R | **Broker** against a stub ledger and stub model: `/v1/session`, Ed25519 tokens, scope check, in-code policy, Redis budgets and nonces, salted payload hashing, pipeline steps 1–7, `/v1/events` SSE | Forged/expired → 401, replay rejected, over-budget → 429; Red gets only an outcome |
| T2.3 | S | **Model cell**: `llama-server` with the pinned GGUF model, output cap 64–128 tokens, deterministic stub for tests | Responds through the Broker in the shield stack |
| T2.4 | R | **Red runner**: attack runner that loads the fixed prompt subset and talks only to the Broker | Sends authenticated requests end to end |
| T2.5 | S+R | Wire Red → Broker → Model → Broker → Red with real ledger entries and events (Blue still stubbed) | Entries and events appear for every hop; `make audit` green |
M2 done when: Broker, ledger, model and Red runner talk through the Broker end to end.

## M3 — Blind defense
| ID | Owner | Task | Done when |
|---|---|---|---|
| T3.1 | S | **Blue sealed evaluator** (do this first in M3): `network_mode: none`, Unix socket volume shared only with the Broker, read-only FS, tmpfs wiped per request, classifier + rule layer, blind output filter, returns only allow/block | Evaluator verified to have no network interface; verdicts flow over the socket |
| T3.2 | S+R | Cache/timing defense: no cross-tenant prompt cache or one slot per tenant, fixed latency buckets + jitter, true latency recorded in the ledger | Padding visible in measurements; true latency in ledger |
| T3.3 | S+R | Normal attack-and-defend loop running with events | Loop runs repeatedly without leaks; `make audit` green |
M3 done when: Blue works over the socket with no network and a normal loop runs.

## M4 — Proof
| ID | Owner | Task | Done when |
|---|---|---|---|
| T4.1 | R | **Baseline stack** `docker-compose.baseline.yml` (one shared network, shared volume, plain) + minimal event emitter (A-05) | Same workload runs; attacks succeed |
| T4.2 | S | **Breach suite B01–B14** (TRD §10.1), runnable on both stacks | Baseline: 12 succeed, B09/B10 n/a; Shield: all blocked/detected; B12 labelled DETECTED, B13 NOT DISTINGUISHABLE |
| T4.3 | S | **Canaries** (TRD §10.3) and scanner over all observable surfaces | Planted canary found on Baseline when leaked; zero crossings on a clean Shield run |
| T4.4 | S | **Hostile Red** escape script | Emits `breach_attempt` events; blocked on Shield, allowed on Baseline; safe to re-run |
| T4.5 | S+R | Results writer: `BreachResult`, `Metric`, `AuditResult`, Run metadata (+ reproducibility record, A-08) in the metadata Postgres | `results/` JSON and DB rows match the contract |
| T4.6 | R | Latency benchmark, 200+ requests, p50/p95 Baseline vs Shield | Numbers with `n` |
| T4.7 | S | Statistics: timing leakage (KS test or AUC before/after), tamper detection per mutation, defense quality (block rate + false positives) on the fixed datasets (FR-53) | Numbers with `n`; datasets recorded in the ledger |
M4 done when: Baseline, breach suite, canaries and hostile Red produce the results table.

## M5 — Dashboard and integration
Track A (frontend, can start in M1 because it runs on the mock; Owner R). Use brief §15–16 exactly; skip milestones already verified in T0.1 but rerun their tests.
| ID | Brief | Scope | Done when |
|---|---|---|---|
| T5.A1 | F1 | Scaffold, tokens, fonts, shell, router, `apiFetch`, `schemas.ts`, docs | Builds; schema tests pass |
| T5.A2 | F2 | Mock server (auth, CSRF, roles, 429, SSE both stacks, hash-chained ledger with tamper/verify/untamper, runs, hostile-red burst, fixtures: 14 breach tests, metrics, audit all-pass and one-fail) | Every brief §6 endpoint works on the mock |
| T5.A3 | F3 | Login, role guard, session, logout closes SSE | E2E 1, 2, 10 |
| T5.A4 | F4 | Event store, Event Feed, Live Topology | E2E 3 |
| T5.A5 | F5 | Breach Wall and Baseline vs Shield split screen | E2E 4, 5 |
| T5.A6 | F6 | Ledger Explorer, Verify, Tamper/Restore | E2E 6 |
| T5.A7 | F7 | Results, snapshot export/load, Audit, Threat Model, Run Control | E2E 7, 9 |
| T5.A8 | F8 | Security, accessibility, projector pass, README sections | E2E 8; brief §13 checklist |
Track B (integration, after M4):
| ID | Owner | Task | Done when |
|---|---|---|---|
| T5.1 | R | **Dashboard API** service (`services/dashboard-api`) implementing brief §6 on `net_front` + `net_ctrl`, bridging Broker `/v1/events`, results store, ledger reads, runs, demo controls; extra fields forbidden | Contract tests pass against the frontend Zod schemas; role/CSRF/429/401 tests pass |
| T5.2 | R | Reverse proxy (`net_front`), CSP and headers, SSE unbuffered; `docs/proxy-requirements.md` | Header scan OK; same-origin only |
| T5.3 | R | Switch `VITE_API_MODE=live` (brief F9); fix mismatches frontend-side first, log backend changes in `CONTRACT_CHANGES.md` | All screens work live; zero schema errors in a full session |
| T5.4 | S+R | Live e2e: brief's 10 Playwright scenarios against the real stack | All pass in live and mock mode |
M5 done when: the three core views plus split screen run on live events.

## M6 — Freeze
| ID | Owner | Task | Done when |
|---|---|---|---|
| T6.1 | S | Security checklist (brief §13 + TRD §12), evidence in STATUS; metadata-only guard at all three layers | No `dangerouslySetInnerHTML`, no external requests, no tokens in storage, secret scan clean, audits reviewed |
| T6.2 | R | Failure modes: backend down, SSE reconnect, session expiry, `one-fail` audit banner; accessibility/projector pass | Each shows the specified state with Retry |
| T6.3 | S+R | Rehearse the PRD §10 demo, mock and live; fix only rough edges | Runs twice in a row without errors |
| T6.4 | S | Final measured numbers into `results/snapshots/*.json` and the results slide; threat model (`docs/threat-model.md`, residual risks in TRD §16) | Offline Results page works from the snapshot; every number has `n` |
| T6.5 | R | README (setup, `make` commands, mock, live, tests, architecture diagram, honest limits) | A newcomer can run the demo from the README |
| T6.6 | S+R | Record the backup demo video; save test output; freeze versions; tag `v1.0-demo` | Tag pushed; video saved |
| T6.7 | S+R | Submission artifacts in the hackathon's format (ask user, PRD §12 Q1) | Organizer checklist satisfied |

## 3. Cut order and never-cut
Cut in this order if time runs short [PLAN2]: extra dashboard polish → the timing experiment (then report B13 honestly as "not measured") → OPA → gVisor. Inside the frontend also use brief §15's order (Run Control polish, Threat Model extras, animations beyond basic packet movement).
**Never cut:** breach suite, canaries, ledger verifier, Baseline comparison, `bayora-audit`, metadata-only guard, login and roles, Live Topology, Breach Wall, split screen, Ledger Explorer with Verify and Tamper, Results.
**Deferred (only if time remains):** OPA, gVisor, mTLS, OpenTimestamps or GitHub head-hash commit, Falco, Grafana, Vault.

## 4. Critical path
T0.1 → T1.1/T1.2 → T1.4 → T1.5 → T1.6 → T2.1 → T2.2 → T2.5 → T3.1 → T4.2 → T4.7 → T5.1 → T5.3 → T6.3 → T6.6.
Frontend Track A does not block on the backend. The two risks most likely to bite are the Blue sealed evaluator (T3.1) and a meaningful timing-leak measurement (T4.7).

## 5. Definition of done
All P0 requirements in the PRD; `make test` and `make audit` green; Baseline 12/14 succeed and Shield 14/14 blocked or detected; canary crossings 0 across the recorded N runs; metadata-only guard proven; no external runtime requests; snapshot saved; backup video recorded; README and threat model complete; demo rehearsed in mock and live.

## 6. First prompt for Claude Code
> Read `CLAUDE.md`, then `docs/IMPLEMENTATION_PLAN.md`, `docs/PRD.md`, `docs/TRD.md`, the frontend brief and `docs/chat/*`. Enter plan mode and execute **Phase 0 only**: inventory `docs/` and `frontend/`, run whatever builds/tests exist, write `docs/STATUS.md`, seed `docs/ASSUMPTIONS.md` from TRD §18, and ask me the open questions in PRD §12 in one short message. Then show the plan for M1.

## 7. Prompt for each later task or milestone
> Continue with the next unfinished task in `docs/IMPLEMENTATION_PLAN.md`. Re-read `docs/STATUS.md`. Write the test first, then the code. Run `make test` and `make audit`. Commit with the task ID, update `docs/STATUS.md`, and stop at the end of the milestone with a summary of done, failed and blocked.
