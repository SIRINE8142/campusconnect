import { defineConfig } from "@playwright/test";

/**
 * Tests end-to-end Playwright.
 * Le serveur de dev est lancé automatiquement sur le port 3100.
 * Lancer d'abord : npx playwright install chromium
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3100",
    locale: "fr-FR",
  },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
