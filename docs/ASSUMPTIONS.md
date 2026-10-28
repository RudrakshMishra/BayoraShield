# Assumptions: BayoraShield Frontend Dashboard

1. **Workspace and Directory Structure**:
   - Following Section 10 of `FRONTEND_BRIEF.md`, all dashboard code lives inside `frontend/`, containing `src/`, `mock/`, `tests/`, `docs/`, and `package.json`.
   - Docs are accessible at repository root `docs/` and mirrored in `frontend/docs/`.

2. **Packages & Dev Dependencies pinned (Section 3)**:
   - Framework & core: `react`, `react-dom`, `vite`, `typescript`.
   - Routing: `react-router-dom`.
   - Server & client state: `@tanstack/react-query`, `zustand`.
   - Validation: `zod`.
   - Styling: `tailwindcss`, `postcss`, `autoprefixer`.
   - Animation & charts: `framer-motion`, `recharts`.
   - Fonts & icons: `@fontsource/montserrat`, `@fontsource/inter`, `@fontsource/jetbrains-mono`, `lucide-react`.
   - Testing: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`.
   - Mock server: `express`, `cookie-parser`, `cors`, `@types/express`, `@types/cookie-parser`, `@types/cors`.
   - Dev runner for mock server: `tsx` (enables direct execution of TypeScript in `mock/server.ts` via `npm run mock`).
   - Linting & type checking: `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`.
   - All versions pinned strictly with no `^` or `~`.

3. **Mock Server Configuration**:
   - Mock server port defaults to `4000` (`PORT=4000`).
   - Vite dev proxy forwards `/api` requests to `http://127.0.0.1:4000`.
   - Session cookie: `session`, `HttpOnly; SameSite=Strict; Path=/`. (To support local HTTP development without browser rejection, the `Secure` flag is enabled conditionally when HTTPS is active or proxied with HTTPS).
   - CSRF cookie: `csrf`, readable by client JavaScript (`SameSite=Strict; Path=/`). State-changing requests (`POST`, `PUT`, `DELETE`) require `X-CSRF-Token` matching this cookie.

4. **Demo Accounts**:
   - Mock server seeds accounts (from `mock/.env.mock` with safe fallbacks):
     - `admin` (password: `admin123`) -> `role: admin`, `demo_controls: true`
     - `operator` (password: `operator123`) -> `role: operator`, `demo_controls: false`
     - `viewer` (password: `viewer123`) -> `role: viewer`, `demo_controls: false`
   - Rate limiting: after 5 consecutive failed logins for an IP/user, HTTP 429 lockout response is returned for 60 seconds.

5. **SSE Events Stream**:
   - Both `shield` and `baseline` stacks stream continuous events at 2-5/sec.
   - Hostile-red bursts trigger 10-15 rapid `breach_attempt` events (blocked on shield, allowed on baseline).

6. **Submission decisions (2026-10-28)**:
   - The submission window is today, so the first delivery prioritizes a mock-complete dashboard and deterministic proof fixtures.
   - Live security validation will run on a Linux VM; Windows checks do not constitute container isolation proof.
   - The first live model and classifier implementation uses deterministic stubs; real model licensing remains a later decision.
   - The public repository uses the MIT license.
