# Bayora Shield

> **Red, Blue and the Model under test: together, but never touching.**  
> *We don't just run safety tests. We make sure the tests can be trusted.*

**Bayora Shield** is a metadata-only security platform for adversarial AI safety testing (Hack in Hills '26, Track 04). It compares an unprotected shared container Baseline with a sealed Shield stack: Red Team attack harnesses, Blue Team defense evaluators, and client LLMs under test are isolated in three sealed cells, mediated by a strict Policy Broker, and cryptographically recorded in a signed, tamper-evident SHA-256 ledger.

---

## Unified Full-Stack Architecture

Frontend, backend API, SSE streams, and the 10-slide landing page are merged into a single cohesive project:

| Component | Responsibility | Endpoints / Path |
|---|---|---|
| **Landing Presentation** | 10-slide full-viewport sliding cybersecurity website | `/` (public), `/landing` |
| **Security Console** | Live Topology, Event Feed, Breach Wall, Ledger Explorer, Run Control, STRIDE Invariants, Attestation | Authenticated `/` |
| **Backend API** | Policy mediation, RBAC session auth, SSE telemetry, tamper-evident hash chaining | `/api/*` |
| **Tamper-Evident Ledger** | Cryptographically chained Merkle blocks with external anchoring | `/api/ledger/*` |
| **Real-Time Feed** | Payload-free streaming telemetry with microsecond latencies | `/api/events` |

---

## Quick Start (Unified Commands)

From the project root:

```bash
# 1. Install dependencies
cd frontend && npm install && cd ..

# 2. Start full-stack development (runs backend API + frontend dev server concurrently)
npm run dev

# 3. Build & start unified full-stack production server (single port, zero CORS)
npm run build
npm start
```

- **Frontend / Landing Page**: `http://localhost:5173` (or `http://localhost:4000` under `npm start`)
- **Backend API**: `http://localhost:4000/api`
- **Demo Accounts**:
  - `admin` / `admin123` (Admin role, full execution controls)
  - `operator` / `operator123` (Operator role, run campaigns)
  - `viewer` / `viewer123` (Viewer role, read-only telemetry)

---

## 10-Slide Landing Page Modules

The public entry point features a 10-slide full-viewport sliding presentation with keyboard arrow navigation (`↓` / `↑` / `PageDown` / `PageUp`):

1. **Slide 01 • Security Mesh**: Zero-Trust Architecture, atmospheric video with SVG grade filters, stats.
2. **Slide 02 • Live Topology**: 5-Node Sealed Container Mesh with interactive node inspector (*Model*, *Red*, *Policy Broker*, *Blue Evaluator*, *Ledger*) and cgroup enforcement.
3. **Slide 03 • Event Feed**: Payload-Free Real-Time Streams with live ticker and interactive filter chips (*All*, *Blocked*, *Allowed*).
4. **Slide 04 • Breach Wall**: Live Threat Telemetry & Mitigation showcasing prompt extraction, multi-turn jailbreak, and indirect injection quarantine cards.
5. **Slide 05 • Baseline vs Bayora Shield**: Interactive stack switcher between **BAYORA SHIELD ISOLATED MESH** (*100% containment*) and **UNPROTECTED BASELINE** (*15.4% containment*).
6. **Slide 06 • Ledger Explorer**: Tamper-Evident SHA-256 Hash Chain with interactive Merkle proof verification button.
7. **Slide 07 • Results & Metrics**: Precision Robustness Scorecards (*99.98% precision*, *<8.4ms latency*, *0 breaches*, *100% audit reproducibility*).
8. **Slide 08 • Run Control**: Automated Adversarial Orchestration scenario launcher with probe telemetry.
9. **Slide 09 • STRIDE Threat Model**: Formal defense invariants (*Spoofing*, *Tampering*, *Repudiation*, *Information Leak*, *Denial of Service*, *Elevation of Privilege* — all mitigated).
10. **Slide 10 • Attestation & Launch**: Enterprise-Ready AI Safety Compliance certificate manifest preview, **Sign In to Security Mesh** CTA, and footer.

---

## Quality Gates & Verification

Run all test suites directly from the root:

```bash
npm run typecheck    # TypeScript verification (0 errors)
npm run lint         # ESLint verification (0 warnings)
npm run test         # Vitest unit test suite (49/49 tests)
npm run e2e          # Playwright end-to-end suite (5/5 tests)
```

Root targets are also provided for Linux VM validation:
`make up`, `make down`, `make test`, `make audit`, `make breach`, `make verify`, and `make demo`.

---

## License

MIT © [RAGflow](https://github.com/RudrakshMishra/BayoraShield)
