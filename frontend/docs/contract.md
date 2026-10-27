# API contract

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
