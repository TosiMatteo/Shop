import { defineConfig } from '@playwright/test';

// Nel container del profilo "e2e" valgono i nomi di servizio della rete Docker;
// in CI Playwright gira sull'agente e il workflow imposta BASE_URL sulla porta
// pubblicata su localhost.
export default defineConfig({
    testDir: './tests',
    globalSetup: './global-setup.ts',
    globalTimeout: 120_000,
    use: {
        baseURL: process.env.BASE_URL ?? 'http://frontend:4200',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 15_000,
    },
    timeout: 30_000,
});
