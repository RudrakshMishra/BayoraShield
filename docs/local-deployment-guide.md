---
name: local-deployment-and-testing-guide
description: Complete checklist and known considerations for testing and deploying BayoraShield locally or on a Linux VM.
metadata:
  type: project
---

# Local Deployment and Testing Guide

When testing or deploying BayoraShield, keep the following environment considerations in mind:

1. **Host Environment Differences (Windows vs Linux/Docker):**
   - **Frontend & Mock Mode:** Runs fully on Windows (or Linux/macOS). Execute `cd frontend && npm install && npm run mock` (and `npm run dev` in a second terminal) for an end-to-end mock demo.
   - **Docker Stacks (`docker compose`) & Playwright E2E:** Requires a Linux environment (or WSL2 with Docker Desktop / native Docker Engine) because Windows hosts lack native Unix socket sharing, `network_mode: none` container behavior, and Playwright Chromium binary installation dependencies (`libnspr4`, `libnss3`, etc.).

2. **Required Pre-checks:**
   - Node.js (v18+) and npm installed.
   - Python 3.12+ for CLI tools (`bayora-verify`, `bayora-audit`).
   - Docker Engine and Docker Compose v2 (on Linux/WSL2).

3. **Running Quality Gates:**
   - Frontend lint, typecheck, tests, and build: `cd frontend && npm run lint && npm run typecheck && npm run test && npm run build`
   - Static compose audit: `python tools/bayora-audit --compose docker-compose.shield.yml`
   - Ledger verifier: `python tools/bayora-sample-ledger --output results/ledger.json && python tools/bayora-verify --ledger results/ledger.json`

[[status]] [[implementation-plan]]
