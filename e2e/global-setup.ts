// Gli indirizzi dipendono da dove gira Playwright:
//  - nel container del profilo "e2e" valgono i nomi di servizio della rete Docker;
//  - in CI Playwright gira sull'agente, quindi il workflow imposta BASE_URL e
//    API_URL sulle porte pubblicate su localhost.
const BASE_URL = process.env.BASE_URL ?? 'http://frontend:4200';
const API_URL = process.env.API_URL ?? 'http://backend:3000';

async function waitForService(url: string, name: string, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            await fetch(url);
            console.log(`${name} is ready.`);
            return;
        } catch {
            console.log(`Waiting for ${name}... (${i + 1}/${retries})`);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    throw new Error(`${name} not reachable at ${url} after ${retries} retries`);
}

export default async function globalSetup() {
    // Aspetta che il frontend Angular sia pronto (ng serve è lento).
    await waitForService(BASE_URL, 'Frontend');

    console.log('Resetting DB with seeds...');
    const response = await fetch(`${API_URL}/test/reset`);
    const body = await response.text();
    console.log('Response body:', body);
    if (!response.ok) throw new Error(`Seed failed: ${response.status}`);
    console.log('DB ready.');
}
