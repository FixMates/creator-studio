import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.mjs",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "127.0.0.1",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-bubbli-e2e",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-bubbli-e2e.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1234567890",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:1234567890:web:e2e",
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
    },
  },
});
