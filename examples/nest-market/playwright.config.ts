import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./web/test",
  outputDir: "../../artifacts/market-browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1080 } },
    },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:5174",
    env: { PORT: "3101", WEB_PORT: "5174", LATENCY_MIN_MS: "80", LATENCY_MAX_MS: "180" },
    reuseExistingServer: false,
    timeout: 60_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
  },
})
