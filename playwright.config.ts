import { defineConfig, devices } from "@playwright/test";

// Runs against the static export. Build first: `pnpm build`.
export default defineConfig({
  testDir: "tests",
  timeout: 45_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4310", trace: "retain-on-failure" },
  webServer: { command: "node scripts/serve.mjs", port: 4310, reuseExistingServer: true },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
