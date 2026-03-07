Progetto di sistemi web
Shop app


## Prerequisiti software

- Ruby `3.4.6` (da `.ruby-version`)
- Rails `8.1.2` (da `Gemfile.lock`)
- Bundler `2.7.2`
- PostgreSQL `16` (immagine `postgres:16` in `docker-compose.yml`)
- Node.js compatibile con Angular CLI `20.3.x` (consigliato `20.x`)
- Angular CLI `20.3.x`

## Istruzioni passo-passo

### 1) Configurare il database (migrazioni e seed prodotti)

Opzione A: con Docker (consigliata, da root del progetto)

```bash
docker compose up -d db
cd backend
bundle install
bin/rails db:create db:migrate db:seed
```

Opzione B: Postgres locale (fuori Docker)

```bash
cd backend
bundle install
DATABASE_HOST=localhost DATABASE_USER=rails DATABASE_PASSWORD=password \
  bin/rails db:create db:migrate db:seed
```

Note:
- Il database di default in `config/database.yml` è `backend_development`. Se usi
  Docker e vuoi allineare il nome, imposta `POSTGRES_DB=backend_development` nel
  `docker-compose.yml` oppure aggiorna `config/database.yml`.
- Il seed scarica immagini casuali da `https://picsum.photos`. Serve accesso a
  Internet; in caso di errore, la seed continua.

### 2) Avviare il backend

Con Docker (da root del progetto):

```bash
docker compose up --build backend
```

Oppure in locale:

```bash
cd backend
DATABASE_HOST=localhost DATABASE_USER=rails DATABASE_PASSWORD=password \
  bin/rails s -b 0.0.0.0
```

Backend disponibile su `http://localhost:3000`.

### 3) Avviare il frontend (sviluppo) o servire la build di produzione

Sviluppo:

```bash
cd frontend
npm install
npm start
```

Frontend disponibile su `http://localhost:4200` (proxy API configurato in
`proxy.conf.json`).

Build di produzione:

```bash
cd frontend
npm run build
```

Servi i file statici generati in `dist/shop` (oppure `dist/shop/browser` se
presente).
