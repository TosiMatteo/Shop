import { test, expect } from '@playwright/test';

const USER = { email: 'mario.rossi@example.com', password: 'Password123!' };

test('debug: cosa vede playwright su /login', async ({ page }) => {
    const response = await page.goto('/login');
    console.log('Status:', response?.status());
    console.log('URL:', page.url());

    // Salva il contenuto HTML della pagina
    const html = await page.content();
    console.log('HTML (primi 500 chars):', html.substring(0, 500));

    await page.screenshot({ path: 'debug-login.png', fullPage: true });
});

// ─── Helper: login ─────────────────────────────────────────────────────────────
async function login(page: any) {
    await page.goto('/login');

    // Aspetta un elemento concreto del DOM invece del custom element Angular,
    // che potrebbe non essere ancora stato renderizzato durante il bootstrap lento.
    await page.waitForSelector('mat-tab-group', { state: 'visible', timeout: 30_000 });

    // Il primo mat-tab-body è il tab "Accedi" (attivo di default).
    const loginTab = page.locator('mat-tab-body').first();
    await loginTab.getByRole('textbox', { name: 'Email' }).fill(USER.email);
    await loginTab.getByRole('textbox', { name: 'Password' }).fill(USER.password);
    await loginTab.getByRole('button', { name: 'Accedi' }).click();

    // Non esiste una route /dashboard: il router Angular redirige il wildcard ** a /products.
    await expect(page).toHaveURL(/products/, { timeout: 15_000 });
}

// ─── Scenario 1: lista prodotti visibile dopo login ────────────────────────────
test('utente autenticato vede la lista prodotti', async ({ page }) => {
    await login(page);

    // La route /products usa loadComponent (lazy), aspetta che le card siano nel DOM.
    await page.waitForSelector('app-product-card', { state: 'visible', timeout: 20_000 });
    await expect(page.locator('app-product-card').first()).toBeVisible();
});

// ─── Scenario 2: login → aggiungi → checkout → ordine confermato ───────────────
test('login → aggiungi al carrello → checkout → ordine confermato', async ({ page }) => {

    // 1. Login
    await login(page);

    // 2. Aggiungi il primo prodotto al carrello.
    await page.waitForSelector('app-product-card', { state: 'visible', timeout: 20_000 });
    await page.locator('app-product-card').first()
        .getByRole('button', { name: 'Aggiungi' }).click();

    // 3. Vai al carrello e verifica che l'articolo sia presente.
    await page.goto('/cart');
    await page.waitForSelector('mat-list', { state: 'visible', timeout: 10_000 });
    await expect(page.locator('mat-list-item').first()).toBeVisible();

    // 4. Procedi al checkout (bottone abilitato: utente autenticato + carrello non vuoto).
    await page.getByRole('button', { name: 'Procedi al checkout' }).click();
    await expect(page).toHaveURL(/checkout/, { timeout: 10_000 });

    // 5. Compila il form di spedizione.
    // Aspetta che il form sia renderizzato (checkout usa un componente standalone).
    await page.waitForSelector('form', { state: 'visible', timeout: 10_000 });

    await page.locator('input[formControlName="firstName"]').fill('Mario');
    await page.locator('input[formControlName="lastName"]').fill('Rossi');
    await page.locator('input[formControlName="street"]').fill('Via Roma 1');
    await page.locator('input[formControlName="city"]').fill('Milano');
    await page.locator('input[formControlName="zip"]').fill('20100');

    // mat-checkbox non genera un <label> standard: click sul testo visibile.
    await page.getByText('Accetto i termini e la privacy policy').click();

    // 6. Conferma l'ordine.
    await page.getByRole('button', { name: 'Conferma ordine' }).click();

    // 7. Il template mostra il banner di successo dopo la creazione dell'ordine.
    await expect(page.getByText('Ordine confermato!')).toBeVisible({ timeout: 15_000 });
});