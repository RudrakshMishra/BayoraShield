import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node node_modules/tsx/dist/cli.mjs mock/server.ts",
      port: 4000,
      reuseExistingServer: true,
      stdout: "ignore",
    },
    {
      command: "node node_modules/vite/bin/vite.js --port 5173",
      port: 5173,
      reuseExistingServer: true,
      stdout: "ignore",
    },
  ],
});
