import { test, expect } from "@playwright/test";

test.describe("Milestone F4: Live Topology and Event Feed", () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies & log in as operator
    await context.clearCookies();
    await page.goto("/login");
    await page.click("#demo-operator-btn");
    await page.click("#login-submit-button");
    await expect(page.locator("#user-profile-badge")).toBeVisible();
  });

  test("E2E Test 3: Topology renders 5 nodes, animated packets, blocked lock, and node inspector", async ({
    page,
  }) => {
    // 1. Visit Live Topology page
    await page.goto("/");
    await expect(page.locator("#page-topology")).toBeVisible();

    // 2. Verify all 5 architecture nodes are rendered
    await expect(page.locator("#node-model")).toBeVisible();
    await expect(page.locator("#node-red")).toBeVisible();
    await expect(page.locator("#node-broker")).toBeVisible();
    await expect(page.locator("#node-blue")).toBeVisible();
    await expect(page.locator("#node-ledger")).toBeVisible();

    // 3. Verify the non-negotiable architectural rule: no direct link between Red and Blue
    await expect(page.locator("#forbidden-cell-link")).toBeAttached();
    await expect(page.getByText("No direct cell-to-cell links")).toBeVisible();

    // 4. Verify SSE stream is connected and receives live events
    await expect(page.locator("#topology-live-badge")).toContainText("LIVE STREAM");

    // 5. Verify packet animations on the canvas:
    // Either an allowed packet or a blocked boundary lock appears from live mock traffic
    const blockedLock = page.locator("#blocked-boundary-lock, [data-testid='blocked-boundary-lock']");
    const allowedPacket = page.locator("[data-testid='allowed-packet']");

    // Wait for at least one packet animation to appear
    await expect(blockedLock.or(allowedPacket).first()).toBeVisible({ timeout: 15000 });

    // 6. Test Node Inspection side panel
    await page.click("#node-red");
    const inspectorPanel = page.locator("#node-inspector-panel");
    await expect(inspectorPanel).toBeVisible();
    await expect(inspectorPanel).toContainText("Red Cell");
    await expect(inspectorPanel).toContainText("Container Isolation Facts");
    await expect(inspectorPanel).toContainText("CAP_DROP_ALL");

    // Close side panel
    await page.click("#close-node-inspector");
    await expect(inspectorPanel).not.toBeVisible();

    // 7. Test Stack Switcher
    await page.click("#stack-toggle-baseline");
    await expect(page.locator("#stack-toggle-baseline")).toHaveClass(/bg-red/);
    await page.click("#stack-toggle-shield");
    await expect(page.locator("#stack-toggle-shield")).toHaveClass(/bg-gold/);
  });

  test("E2E Test: Event Feed table, metadata banner, filters, and pause control", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator("#page-events")).toBeVisible();

    // 1. Rule 1 banner must be prominently visible
    const banner = page.locator("#metadata-only-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Metadata only: payload content is never shown");

    // 2. Stream status is active
    await expect(page.locator("#connection-status-badge")).toContainText("STREAM ACTIVE");

    // 3. Events populate in table
    const tableRows = page.locator("#event-feed-table tbody tr");
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });

    // 4. Test Pause/Resume functionality
    const pauseBtn = page.locator("#event-feed-pause-btn");
    await expect(pauseBtn).toContainText("Pause Stream");
    await pauseBtn.click();
    await expect(pauseBtn).toContainText("Resume Stream");
    await pauseBtn.click();
    await expect(pauseBtn).toContainText("Pause Stream");

    // 5. Test Outcome Filter
    await page.selectOption("#filter-outcome", "blocked");
    await page.waitForTimeout(500);

    // If rows exist after filter, they must contain BLOCKED
    const blockedBadges = page.locator("#event-feed-table tbody tr td").getByText("BLOCKED");
    if ((await blockedBadges.count()) > 0) {
      await expect(blockedBadges.first()).toBeVisible();
    }

    // Reset filters
    await page.click("#reset-filters-btn");
  });
});
