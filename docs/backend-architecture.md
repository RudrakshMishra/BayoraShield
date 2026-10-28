# BayoraShield Backend & Architecture Overview

BayoraShield is structured as a zero-trust, metadata-only adversarial AI safety testing platform. The backend consists of isolated microservices communicating over restricted internal Docker networks, backed by a cryptographic tamper-evident ledger and a sealed evaluation cell.

## Architecture & Microservices

1. **Broker (`services/broker`)**:
   - Acts as the sole gateway between untrusted adversarial test clients (Red runner) and protected model/evaluator cells.
   - Enforces capability tokens, rate limits, nonces, salted payload hashes, and default-deny safety policies.
   - Forwards outcomes only (never raw prompt payloads) and emits real-time metadata SSE events.

2. **Ledger Service (`services/ledger`)**:
   - Maintains an append-only hash-chained ledger (`seq`, `ts`, `cell`, `action`, `payload_hash`, `prev_hash`, `entry_hash`, `sig`) backed by PostgreSQL with immutable triggers preventing `UPDATE` and `DELETE`.
   - Signs entries with Ed25519 keys and provides REST endpoints (`POST /append`, `GET /head`, `GET /entries`).

3. **Sealed Evaluator / Blue (`services/blue`)**:
   - Runs with `network_mode: none` and communicates exclusively with the Broker via a restricted local Unix socket (`/run/bayora/broker.sock`).
   - Performs rule-based and classifier safety evaluations with timing jitter defenses.

4. **Model Cell (`services/model`)**:
   - Hosts the target LLM / classifier endpoint (`llama-server` / deterministic stub) on an isolated internal network (`net_model`).

5. **Red Runner (`services/red`)**:
   - Automated adversarial probe runner testing safety boundaries against the Broker.

6. **Dashboard API (`services/dashboard-api`)**:
   - Implements the REST and SSE contract (`docs/contract.md`) for the React frontend, proxying verified ledger state, event feeds, audit results, and demo run controls.

## Hardened Docker Compose Stacks

- **`docker-compose.shield.yml`**: Production security baseline enforcing non-root users (`10001:10001`), dropped capabilities (`cap_drop: [ALL]`), read-only root filesystems, `no-new-privileges`, resource limits (`mem_limit`, `cpus`, `pids_limit`), internal networks, and isolated Unix sockets.
- **`docker-compose.baseline.yml`**: Naive comparison fixture sharing networks and volumes for baseline testing and comparison.
