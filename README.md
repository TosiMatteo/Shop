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

# Architettura — Shop App

---

## Stack tecnologico

Il progetto segue un'architettura client-server classica con separazione netta tra backend e frontend.

Il **backend** è un'applicazione Rails 8 in modalità API-only. Espone endpoint REST sotto il prefisso `/api/` e gestisce autenticazione, logica di business, persistenza su PostgreSQL e upload di immagini tramite Active Storage.

Il **frontend** è una Single Page Application Angular 20 che comunica col backend tramite HTTP. In sviluppo il proxy di Angular (`proxy.conf.json`) redirige le chiamate `/api/*` verso `localhost:3000`, eliminando problemi CORS durante lo sviluppo locale.

---

## Modelli di dominio

### Customer

Rappresenta l'utente finale registrato. Gestito tramite Devise con strategia JWT (`devise-jwt`): al login viene emesso un token Bearer incluso nell'header `Authorization`, che il frontend conserva in `localStorage` e allega a ogni richiesta successiva tramite un `HttpInterceptor`.

Ha una relazione `has_one :cart` e `has_many :orders`.

### Admin

Entità separata da `Customer`, con propri endpoint di autenticazione (`/api/admins/sign_in`). Può accedere alle action di creazione, modifica e cancellazione prodotti. Non ha carrello né ordini.

### Product

Rappresenta un articolo del catalogo. Campi principali: `title`, `description`, `price`, `original_price`, `sale` (booleano per prodotti in offerta). Ha un'immagine allegata tramite Active Storage (`has_one_attached :thumbnail`), servita come variante ridimensionata (300×300) tramite `rails_representation_path`.

Espone scope concatenabili per ricerca per titolo, tag, fascia di prezzo, stato offerta e ordinamento.

### Tag

Etichetta categorizzante associata ai prodotti tramite la tabella join `ProductTag` (`has_many :tags, through: :product_tags`).

### Cart

Carrello persistente sul database, con relazione `belongs_to :customer` (uno per cliente) e `has_many :cart_items`. Calcola il totale sommando `quantity × price` per ogni item tramite una query SQL aggregata.

### CartItem

Riga del carrello: `belongs_to :cart`, `belongs_to :product`, con campo `quantity`. Valida l'unicità di `product_id` per `cart_id` (non si possono avere due righe per lo stesso prodotto nello stesso carrello; un secondo `addItem` incrementa la quantità esistente).

### Order

Ordine creato al completamento del checkout. Campi: `total`, `status` (enum, parte da `processing`), dati di spedizione (`shipping_name`, `shipping_street`, `shipping_city`, `shipping_zip`), `customer_id`. Ha `has_many :order_items`.

### OrderItem

Snapshot del prodotto al momento dell'acquisto: `product_id`, `quantity`, `unit_price` (copiato da `product.price` al momento del checkout, immune a future variazioni di prezzo).

---

## Flusso principale: login → carrello → checkout → ordine

### Carrello guest (utente non autenticato)

L'utente può aggiungere prodotti al carrello prima di autenticarsi. Gli item vengono serializzati in `localStorage` con la chiave `guest_cart`, includendo l'oggetto `Product` completo (necessario per mostrare nome, prezzo e immagine senza chiamate aggiuntive al server).

### Login e sincronizzazione

Al login riuscito, `AuthService` emette un evento tramite il `Subject` `loginEvent$`. `CartService` è iscritto a questo stream nel costruttore: alla ricezione dell'evento chiama `syncGuestCart()`, che:

1. legge gli item da `localStorage`,
2. carica o crea il carrello server per il cliente appena autenticato,
3. invia in parallelo (`forkJoin`) una richiesta `POST /api/carts/:id/cart_items` per ogni item guest,
4. ricarica il carrello aggiornato dal server,
5. svuota `localStorage`.

Gli errori su singoli item (es. prodotto non più disponibile) vengono ignorati silenziosamente (`catchError(() => of(null))`), così la sync non blocca il flusso.

### Gestione del carrello autenticato

Con utente loggato, ogni operazione (aggiunta, modifica quantità, rimozione) viene eseguita tramite le API REST e seguita da un reload del carrello dal server, mantenendo `cartSubject` sempre sincronizzato con lo stato reale del database.

### Checkout

Il frontend invia `POST /api/carts/:id/checkout` con i parametri di spedizione. Il backend esegue l'intera operazione in una transazione SQL:

1. calcola il totale corrente del carrello,
2. crea il record `Order` con stato `processing` e dati di spedizione,
3. crea un `OrderItem` per ogni `CartItem` con lo snapshot del prezzo corrente,
4. chiama `cart.destroy` (che elimina anche i `CartItem` per `dependent: :destroy`).

Se il carrello è vuoto viene sollevata una `ActiveRecord::RecordInvalid` e la transazione viene annullata. In caso di successo il frontend riceve i dati dell'ordine creato e azzera il `cartSubject` localmente.

---

## Funzionalità avanzate implementate

### Autenticazione JWT stateless

Tramite `devise-jwt`, ogni risposta al login include un header `Authorization: Bearer <token>`. Il token viene conservato nel `localStorage` del browser e re-inviato su ogni richiesta dall'`AuthInterceptor` Angular. Il backend valida il token in `authenticate_customer!` e `authenticate_admin!` definiti nell'`ApplicationController`.

### Paginazione server-side con cache

Il catalogo prodotti usa `pagy` con l'opzione `ttl: 300` (cache dei conteggi per 5 minuti) per ridurre il numero di `COUNT(*)` sul database. La risposta include un oggetto `pagy` con i metadati di paginazione (pagina corrente, totale pagine, totale elementi) che il frontend usa per costruire il paginatore.

### Ricerca e filtri combinabili

I prodotti si possono filtrare per titolo (LIKE), tag (JOIN su `product_tags`), fascia di prezzo (min/max), stato offerta e ordinamento (data/prezzo, asc/desc). I filtri sono implementati come scope Rails concatenabili, rendendo ogni combinazione possibile con una singola query.

### Carrello guest con sincronizzazione al login

Descritta nel flusso principale. Permette all'utente di fare shopping senza registrarsi e di non perdere il carrello al momento dell'accesso. Il pattern usa un `Subject<void>` in `AuthService` per disaccoppiare il servizio di autenticazione da quello del carrello, evitando dipendenze circolari.

### Gestione immagini con Active Storage e varianti

Le immagini dei prodotti vengono caricate tramite Active Storage con `has_one_attached :thumbnail`. In lettura vengono servite come varianti ridimensionate (`resize_to_limit: [300, 300]`) tramite `rails_representation_path`, con lazy generation della variante al primo accesso. Il controller include esplicitamente `thumbnail_attachment: { blob: :variant_records }` per evitare N+1 query sul catalogo.

### Rate limiting

`rack-attack` è configurato per proteggere le API da abusi (brute force su login, flood di richieste). Le regole di throttling sono definite in `config/initializers/rack_attack.rb`.

### Separazione dei ruoli Customer / Admin

I due ruoli sono modelli distinti con tabelle, endpoint di autenticazione e token separati. Gli endpoint di scrittura sui prodotti (`create`, `update`, `destroy`) richiedono `authenticate_admin!`; le action del carrello richiedono `authenticate_customer!`. Un admin non può operare sul carrello e viceversa.