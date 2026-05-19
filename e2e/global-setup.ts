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
    await waitForService('http://frontend:4200', 'Frontend');

    console.log('Resetting DB with seeds...');
    const response = await fetch('http://backend:3000/test/reset');
    const body = await response.text();
    console.log('Response body:', body);
    if (!response.ok) throw new Error(`Seed failed: ${response.status}`);
    console.log('DB ready.');
}