import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    globalSetup: './global-setup.ts',
    globalTimeout: 120_000,
    use: {
        baseURL: 'http://frontend:4200',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 15_000,
    },
    timeout: 30_000,
});