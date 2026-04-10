# Shop App

Applicazione e-commerce full-stack composta da un backend Rails API-only e un frontend Angular. Supporta navigazione e acquisto prodotti, carrello guest (persistito in `localStorage`) con sincronizzazione automatica al login, checkout con dati di spedizione e storico ordini.

---

## Prerequisiti software

| Software | Versione |
|---|---|
| Ruby | `3.4.x` (vedi `.ruby-version`) |
| Rails | `~> 8.1.1` |
| Bundler | `>= 2.7` |
| PostgreSQL | `16` |
| Node.js | `20.x` (LTS consigliato) |
| Angular CLI | `20.3.x` |
| Docker + Docker Compose | qualsiasi versione recente (opzionale ma consigliato) |

---

## Avvio rapido con Docker (consigliato)

Dalla root del progetto, un singolo comando avvia database, backend e frontend:

```bash
docker compose up --build
```

| Servizio | URL |
|---|---|
| Frontend Angular | `http://localhost:4200` |
| Backend Rails API | `http://localhost:3000` |
| PostgreSQL | `localhost:5432` |

Al primo avvio è necessario eseguire le migrazioni e il seed (vedi sezione dedicata).

---

## Configurazione passo-passo

### 1. Clonare il repository

```bash
git clone <url-repository>
cd <nome-cartella>
```

### 2. Configurare il database

**Opzione A — con Docker (consigliata)**

```bash
# Avvia solo il database
docker compose up -d db

# Installa le dipendenze ed esegui migrazioni + seed
cd backend
bundle install
bin/rails db:create db:migrate db:seed
```

**Opzione B — PostgreSQL locale**

```bash
cd backend
bundle install
DATABASE_HOST=localhost DATABASE_USER=rails DATABASE_PASSWORD=password \
  bin/rails db:create db:migrate db:seed
```

> Il seed popola il catalogo prodotti scaricando immagini da `https://picsum.photos`. È richiesta connessione Internet; in caso di errore su una singola immagine il seed prosegue comunque.

> Il database configurato nel `docker-compose.yml` è `rails_development`. Verifica che corrisponda al valore in `config/database.yml`.

---

### 3. Avviare il backend

**Con Docker:**

```bash
docker compose up --build backend
```

**In locale:**

```bash
cd backend
DATABASE_HOST=localhost DATABASE_USER=rails DATABASE_PASSWORD=password \
  bin/rails s -b 0.0.0.0
```

Backend disponibile su `http://localhost:3000`.

---

### 4. Avviare il frontend

**Sviluppo (con hot reload):**

```bash
cd frontend
npm install
npm start
```

Frontend disponibile su `http://localhost:4200`. Le chiamate API vengono proxate verso `http://localhost:3000` tramite `proxy.conf.json`.

**Con Docker:**

```bash
docker compose up --build frontend
```

**Build di produzione:**

```bash
cd frontend
npm run build
```

I file statici vengono generati in `dist/shop/browser/` e possono essere serviti con qualsiasi web server statico (nginx, `http-server`, ecc.).

---

## Variabili d'ambiente (backend)

| Variabile | Descrizione | Default Docker |
|---|---|---|
| `DATABASE_HOST` | Host PostgreSQL | `db` |
| `DATABASE_USER` | Utente PostgreSQL | `rails` |
| `DATABASE_PASSWORD` | Password PostgreSQL | `password` |
| `DATABASE_NAME` | Nome del database | `rails_development` |

---

## Dipendenze principali

### Backend (Gemfile)

| Gem | Scopo |
|---|---|
| `rails ~> 8.1.1` | Framework web |
| `pg` | Adapter PostgreSQL |
| `devise` + `devise-jwt` | Autenticazione con token JWT |
| `pagy` | Paginazione server-side |
| `rack-attack` | Rate limiting e protezione API |
| `rack-cors` | Gestione CORS per richieste cross-origin |
| `image_processing ~> 1.2` | Trasformazioni immagini via Active Storage |
| `solid_cache` / `solid_queue` / `solid_cable` | Cache, job e WebSocket su database |

### Frontend

| Pacchetto | Scopo |
|---|---|
| `@angular/core 20.x` | Framework SPA |
| `rxjs` | Gestione flussi asincroni |
| SCSS | Stile componenti |

---

## Struttura del repository

```
.
├── backend/          # Rails API-only
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── ...
│   ├── db/
│   │   ├── migrate/
│   │   └── seeds.rb
│   └── Gemfile
├── frontend/         # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── models/
│   │   └── ...
│   └── angular.json
├── docker-compose.yml
└── README.md
```

--- 