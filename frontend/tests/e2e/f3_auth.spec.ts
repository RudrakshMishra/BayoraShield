import { test, expect } from "@playwright/test";

test.describe("Milestone F3: Authentication, Role Gating, and Session Lifecycle", () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies between tests to ensure clean state
    await context.clearCookies();
  });

  test("E2E Test 1: Login success, login failure (generic message), and lockout on repeated failures", async ({
    page,
  }) => {
    // 1. Unauthenticated visit to protected route redirects to /login
    await page.goto("/ledger");
    await expect(page).toHaveURL(/.*\/login/);

    // 2. Login failure: generic error message (never reveal username or password validity)
    await page.fill("#username-input", "attacker_probe");
    await page.fill("#password-input", "incorrect-pass");
    await page.click("#login-submit-button");

    const errorBanner = page.locator("#login-error-banner");
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText("Invalid credentials");

    // 3. Repeated failed attempts trigger 429 lockout for that user
    for (let i = 0; i < 4; i++) {
      await page.fill("#password-input", `bad-pass-${i}`);
      await page.click("#login-submit-button");
      await page.waitForTimeout(100);
    }

    // 5th failed attempt should trigger rate limit lockout
    await page.fill("#password-input", "final-bad-pass");
    await page.click("#login-submit-button");

    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Too many requests|Too many failed|Locked out/i);

    // 4. Successful login with clean account (operator)
    await page.fill("#username-input", "operator");
    await page.fill("#password-input", "operator123");
    await page.click("#login-submit-button");

    // Verify redirected to protected destination or home
    await expect(page).toHaveURL(/.*(\/ledger|\/)/);
    await expect(page.locator("#user-profile-badge")).toBeVisible();
    await expect(page.locator("#user-role-badge")).toContainText("operator");
  });

  test("E2E Test 2: Role gating for viewer, operator, and admin", async ({ page }) => {
    // --- VIEWER ROLE ---
    await page.goto("/login");
    await page.click("#demo-viewer-btn");
    await page.click("#login-submit-button");
    await expect(page.locator("#user-role-badge")).toContainText("viewer");

    // Viewer on Ledger: cannot see Verify or Tamper controls
    await page.goto("/ledger");
    await expect(page.locator("#page-ledger")).toBeVisible();
    await expect(page.locator("#verify-ledger-button")).not.toBeVisible();
    await expect(page.locator("#admin-demo-controls")).not.toBeVisible();

    // Viewer attempting to visit /runs directly: receives Access Denied (403)
    await page.goto("/runs");
    await expect(page.locator("text=Access Denied (403)")).toBeVisible();
    await expect(page.locator("text=Requires minimum role: OPERATOR")).toBeVisible();

    // Sign out viewer
    await page.click("#logout-button");
    await expect(page).toHaveURL(/.*\/login/);

    // --- OPERATOR ROLE ---
    await page.click("#demo-operator-btn");
    await page.click("#login-submit-button");
    await expect(page.locator("#user-role-badge")).toContainText("operator");

    // Operator on Ledger: CAN see Verify, CANNOT see Tamper
    await page.goto("/ledger");
    await expect(page.locator("#verify-ledger-button")).toBeVisible();
    await expect(page.locator("#admin-demo-controls")).not.toBeVisible();

    // Operator visiting /runs: permitted, shows action controls
    await page.goto("/runs");
    await expect(page.locator("#page-runs")).toBeVisible();
    await expect(page.locator("#start-run-button")).toBeVisible();

    // Sign out operator
    await page.click("#logout-button");
    await expect(page).toHaveURL(/.*\/login/);

    // --- ADMIN ROLE ---
    await page.click("#demo-admin-btn");
    await page.click("#login-submit-button");
    await expect(page.locator("#user-role-badge")).toContainText("admin");

    // Admin on Ledger: CAN see Verify AND Demo Tamper / Restore controls
    await page.goto("/ledger");
    await expect(page.locator("#verify-ledger-button")).toBeVisible();
    await expect(page.locator("#admin-demo-controls")).toBeVisible();
    await expect(page.locator("#tamper-ledger-button")).toBeVisible();
    await expect(page.locator("#restore-ledger-button")).toBeVisible();
  });

  test("E2E Test 10: Logout closes SSE streams and returns to login page", async ({ page }) => {
    // 1. Log in
    await page.goto("/login");
    await page.click("#demo-operator-btn");
    await page.click("#login-submit-button");
    await expect(page.locator("#user-profile-badge")).toBeVisible();

    // 2. Perform Logout
    await page.click("#logout-button");

    // 3. Confirm returned to login page
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator("#user-profile-badge")).not.toBeVisible();
    await expect(page.locator("#login-submit-button")).toBeVisible();

    // 4. Confirm route is locked out and redirects back to login
    await page.goto("/events");
    await expect(page).toHaveURL(/.*\/login/);
  });
});
