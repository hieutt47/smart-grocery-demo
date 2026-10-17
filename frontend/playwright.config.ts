import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {baseURL: 'http://127.0.0.1:8001', trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure'},
  projects: [
    {name: 'chromium-mobile', use: {...devices['Pixel 7'], defaultBrowserType: 'chromium'}},
    {name: 'firefox-desktop', use: {browserName: 'firefox', viewport: {width: 1366, height: 900}}},
  ],
  webServer: {
    command: 'node ../scripts/e2e-server.mjs',
    url: 'http://127.0.0.1:8001/api/v1/health',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
