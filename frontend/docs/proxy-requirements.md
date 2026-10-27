# Proxy Requirements (BayoraShield Dashboard)

The reverse proxy sitting in front of the frontend and API must enforce the following security headers and proxy configuration:

1. **Content Security Policy (CSP)**:
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';
   ```
   *Note: Fonts and icons are self-hosted via bundled npm packages, enabling a strict `'self'` policy without third-party CDN exceptions.*

2. **Security Headers**:
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   Referrer-Policy: no-referrer
   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
   Permissions-Policy: geolocation=(), camera=(), microphone=()
   ```

3. **Routing**:
   - `/api/*` -> Forwarded to Dashboard API backend (or mock server in dev)
   - `/*` -> Static frontend bundle (SPA fallback to `index.html`)

4. **Cookie Forwarding**:
   - `session` cookie (HttpOnly, Secure, SameSite=Strict) must be preserved in requests to `/api/*`.
   - `csrf` cookie must be readable by frontend JavaScript.
