# BayoraShield

BayoraShield is a metadata-only security console for adversarial AI safety testing. It compares a naive shared Docker Baseline with a mediated Shield stack: Red, Blue, and Model cells are separated by a Policy Broker, and actions are recorded in a tamper-evident ledger.

> We don't just run safety tests. We make sure the tests can be trusted.

## Quick start (mock dashboard)

```bash
cd frontend
npm install
npm run mock
# in a second terminal
npm run dev
```

Open `http://127.0.0.1:5173/login`. Demo credentials are local mock fixtures only: `viewer/viewer123`, `operator/operator123`, and `admin/admin123`.

## Quality commands

```bash
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
```

Root targets are provided for Linux validation: `make up`, `make down`, `make test`, `make audit`, `make breach`, `make verify`, and `make demo`.

## Security posture

The browser talks only to `/api/*`; events and ledger records are strict metadata-only schemas. Authentication uses HttpOnly session cookies plus CSRF headers. The mock dashboard is not a production security boundary. Validate the shield compose stack, `bayora-audit`, and breach suite on the Linux VM before making isolation claims.

See `docs/PRD.md`, `docs/TRD.md`, `docs/MRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/FRONTEND_BRIEF.md`, `docs/contract.md`, and `docs/threat-model.md`.
