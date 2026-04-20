# Shop App

> Full-stack e-commerce application — Rails 8 API + Angular 20 SPA
---

## Indice

- [Stack tecnologico](#stack-tecnologico)
- [Avvio rapido](#avvio-rapido)
- [Variabili d'ambiente](#variabili-dambiente)
- [Dipendenze](#dipendenze)
- [Struttura del repository](#struttura-del-repository)
- [Modelli di dominio](#modelli-di-dominio)
- [Flusso principale](#flusso-principale)
- [Funzionalità avanzate](#funzionalità-avanzate)
- [Testing](#testing)

---

## Stack tecnologico

Il progetto segue un'architettura client-server con separazione netta tra backend e frontend.

| Layer | Tecnologia | Note |
|---|---|---|
| **Backend** | Rails 8.1 API-only | Endpoint REST sotto `/api/`, JWT auth, Active Storage |
| **Frontend** | Angular 20 SPA | Comunica col backend via HTTP, proxy in sviluppo |
| **Database** | PostgreSQL 16 | ORM ActiveRecord, migrazioni versioniate |
| **Infrastruttura** | Docker + Kamal | `docker-compose.yml` per sviluppo locale |

In sviluppo il proxy Angular (`proxy.conf.json`) redirige `/api/*` verso `localhost:3000`, eliminando problemi CORS senza configurazioni aggiuntive.

---

## Avvio rapido

### Con Docker (consigliato)

```bash
# Clona il repository
git clone <repo-url> && cd shop-app
 
# Prima esecuzione: costruisce le immagini e avvia i container
docker compose up --build
```

Al primo avvio, in un secondo terminale, esegui migrazioni e seed:

```bash
docker compose exec backend rails db:create db:migrate db:seed
```

> Il seed scarica immagini da `https://picsum.photos`: è richiesta connessione Internet. Un eventuale errore su una singola immagine non blocca il seed.

| Servizio | URL |
|---|---|
| Frontend Angular | `http://localhost:4200` |
| Backend Rails API | `http://localhost:3000` |
| PostgreSQL | `localhost:5432` |
 
---

### Senza Docker

**Prerequisiti:** Ruby `3.4.x`, PostgreSQL `16`, Node.js `20.x`, Angular CLI `20.3.x`.

**Backend:**

```bash
cd backend
bundle install
DATABASE_HOST=localhost DATABASE_USER=rails DATABASE_PASSWORD=password \
  bin/rails db:create db:migrate db:seed
DATABASE_HOST=localhost DATABASE_USER=rails DATABASE_PASSWORD=password \
  bin/rails s -b 0.0.0.0
```

**Frontend** (in un secondo terminale):

```bash
cd frontend
npm install
npm start
```

Le chiamate API vengono proxate verso `http://localhost:3000` tramite `proxy.conf.json`, senza configurazioni CORS aggiuntive.

---

## Variabili d'ambiente

Configurabili nel `docker-compose.yml` o in un file `.env` nella cartella `backend/`.

| Variabile | Descrizione | Default Docker |
|---|---|---|
| `DATABASE_HOST` | Host PostgreSQL | `db` |
| `DATABASE_USER` | Utente PostgreSQL | `rails` |
| `DATABASE_PASSWORD` | Password PostgreSQL | `password` |
| `DATABASE_NAME` | Nome del database | `rails_development` |

---

## Dipendenze

<details>
<summary><strong>Backend — Gemfile (produzione)</strong></summary>

<br>

| Gem | Scopo |
|---|---|
| `rails ~> 8.1.1` | Framework web |
| `pg` | Adapter PostgreSQL |
| `puma >= 5.0` | Web server multi-thread |
| `devise` + `devise-jwt` | Autenticazione con token JWT stateless |
| `pagy` | Paginazione server-side con cache dei conteggi |
| `rack-attack` | Rate limiting e protezione API da abusi |
| `rack-cors` | Gestione CORS per richieste cross-origin |
| `image_processing ~> 1.2` | Trasformazioni immagini via Active Storage |
| `solid_cache` | Cache su database (alternativa a Redis) |
| `solid_queue` | Job queue su database |
| `solid_cable` | WebSocket su database |
| `bootsnap` | Riduzione dei tempi di boot tramite caching bytecode |
| `kamal` | Deploy dell'applicazione come container Docker |
| `thruster` | Asset caching/compression e X-Sendfile su Puma |
| `tzinfo-data` | Dati timezone per ambienti Windows/JRuby |

</details>

<details>
<summary><strong>Backend — Gemfile (development &amp; test)</strong></summary>

<br>

| Gem | Gruppo | Scopo |
|---|---|---|
| `debug` | development, test | Debugger interattivo Ruby 3.x con breakpoint via `binding.break`. Sostituisce `byebug`. |
| `bundler-audit` | development, test | Controlla il `Gemfile.lock` contro il database CVE di Ruby Advisory. Da eseguire in CI con `bundle exec bundler-audit check --update`. |
| `brakeman` | development, test | Analisi statica del codice Rails per individuare vulnerabilità (SQL injection, XSS, mass assignment) senza eseguire l'applicazione. |
| `rubocop-rails-omakase` | development, test | Linter di stile con configurazione Omakase di Rails (Basecamp). Garantisce coerenza stilistica e individua pattern non idiomatici. |
| `faker` | development, test | Generazione di dati fittizi realistici per seed e fixtures. |
| `letter_opener` | development | Intercetta le email in uscita e le apre nel browser. Utile per testare i flussi email di Devise senza un server SMTP reale. |
| `simplecov` | test | Misura la percentuale di righe coperte dalla suite di test. Genera un report HTML in `coverage/`. |

</details>

<details>
<summary><strong>Frontend</strong></summary>

<br>

| Pacchetto | Scopo |
|---|---|
| `@angular/core 20.x` | Framework SPA |
| `rxjs` | Gestione flussi asincroni |
| SCSS | Stile componenti |

</details>

---

## Struttura del repository

```
.
├── backend/                  # Rails API-only
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── ...
│   ├── db/
│   │   ├── migrate/
│   │   └── seeds.rb
│   └── Gemfile
├── frontend/                 # Angular SPA
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

## Modelli di dominio

```
Customer ──has_one──▶ Cart ──has_many──▶ CartItem ──belongs_to──▶ Product
    │                                                                  │
    └──has_many──▶ Order ──has_many──▶ OrderItem ──belongs_to───▶ ─────┘

Product ──has_many──▶ ProductTag ──belongs_to──▶ Tag
```

<details>
<summary><strong>Customer</strong></summary>

Rappresenta l'utente finale registrato. Gestito tramite Devise con strategia JWT: al login viene emesso un token Bearer incluso nell'header `Authorization`, che il frontend conserva in `localStorage` e allega a ogni richiesta tramite un `HttpInterceptor`.

Relazioni: `has_one :cart`, `has_many :orders`.

</details>

<details>
<summary><strong>Admin</strong></summary>

Entità separata da `Customer`, con propri endpoint di autenticazione (`/api/admins/sign_in`). Può accedere alle action di creazione, modifica e cancellazione prodotti. Non ha carrello né ordini.

</details>

<details>
<summary><strong>Product</strong></summary>

Articolo del catalogo. Campi principali: `title`, `description`, `price`, `original_price`, `sale` (booleano). Immagine allegata via Active Storage (`has_one_attached :thumbnail`), servita come variante 300×300 tramite `rails_representation_path`.

Espone scope concatenabili per ricerca per titolo, tag, fascia di prezzo, stato offerta e ordinamento.

</details>

<details>
<summary><strong>Cart e CartItem</strong></summary>

**Cart** — carrello persistente su database, `belongs_to :customer`, `has_many :cart_items`. Calcola il totale con una query SQL aggregata (`quantity × price`). Viene distrutto al checkout insieme ai suoi item (`dependent: :destroy`).

**CartItem** — riga del carrello: `belongs_to :cart`, `belongs_to :product`, campo `quantity`. Valida l'unicità di `product_id` per `cart_id`; un secondo `addItem` sullo stesso prodotto incrementa la quantità invece di creare una riga duplicata.

</details>

<details>
<summary><strong>Order e OrderItem</strong></summary>

**Order** — creato al checkout. Campi: `total`, `status` (enum, default `processing`), dati di spedizione (`shipping_name`, `shipping_street`, `shipping_city`, `shipping_zip`), `customer_id`.

**OrderItem** — snapshot del prodotto al momento dell'acquisto: `product_id`, `quantity`, `unit_price` copiato da `product.price`. Immune a future variazioni di prezzo.

</details>

---

## Flusso principale

### Carrello guest → login → sincronizzazione

L'utente può aggiungere prodotti prima di autenticarsi. Gli item vengono serializzati in `localStorage` (`guest_cart`) con l'oggetto `Product` completo.

Al login, `AuthService` emette un evento su `loginEvent$` (Subject RxJS). `CartService`, iscritto nel costruttore, chiama `syncGuestCart()` che:

1. Legge gli item da `localStorage`
2. Carica o crea il carrello server per il cliente autenticato
3. Invia in parallelo (`forkJoin`) `POST /api/carts/:id/cart_items` per ogni item
4. Ricarica il carrello dal server e svuota `localStorage`

Gli errori su singoli item vengono ignorati silenziosamente (`catchError(() => of(null))`) per non bloccare il flusso.

### Checkout

Il frontend invia `POST /api/carts/:id/checkout` con i parametri di spedizione. Il backend esegue tutto in una transazione SQL:

1. Calcola il totale corrente del carrello
2. Crea il record `Order` con status `processing`
3. Crea un `OrderItem` per ogni `CartItem` (snapshot del prezzo)
4. Chiama `cart.destroy` (a cascata elimina i `CartItem`)

Se il carrello è vuoto viene sollevata `ActiveRecord::RecordInvalid` e la transazione viene annullata. In caso di successo il frontend riceve i dati dell'ordine e azzera il `cartSubject` localmente.

---

## Funzionalità avanzate

<details>
<summary><strong>Area Admin — gestione prodotti e tag</strong></summary>
<br>
Sezione riservata per creare, modificare ed eliminare prodotti e tag. La protezione opera su due livelli indipendenti.

**Backend**

`Admins::SessionsController` e `Admins::PasswordsController` gestiscono autenticazione e reset password su endpoint separati da quelli del customer (`/api/admins/sign_in`, `/api/admins/password`). Il token JWT emesso al login identifica il ruolo admin e viene validato dal `before_action :authenticate_admin!` presente in `ProductsController` e `TagsController` sulle sole action di scrittura (`create`, `update`, `destroy`). Le action di lettura (`index`, `show`) rimangono pubbliche.

```ruby
# products_controller.rb
before_action :authenticate_admin!, only: [:create, :update, :destroy]
 
# tags_controller.rb
before_action :authenticate_admin!, only: [:create, :update, :destroy]
```

**Frontend — routing e guard**

Le rotte admin sono raggruppate in `ADMIN_ROUTES` sotto il prefisso `/admin`. La rotta `login` è pubblica; tutte le rotte figlie sono protette da `adminGuard`, che blocca l'accesso e reindirizza al login se il token admin non è presente.

```
/admin/login       → AdminLogin  (pubblica)
/admin/admin-page  → AdminPage   (protetta da adminGuard)
```

**Frontend — AdminPage**

`AdminPage` gestisce prodotti e tag in un'unica vista con due sezioni a scomparsa (`MatExpansionPanel`):

- **Form prodotto** — supporta modalità `create` ed `edit`. Al click su "modifica" da un `AdminProductCard`, il form viene popolato via `patchValue`, il panel viene aperto programmaticamente (`productPanel.open()`) e la pagina scorre in cima. L'invio costruisce un `FormData` per supportare l'upload dell'immagine (`product[thumbnail]`) insieme ai campi testuali e all'array di tag (`product[tag_ids][]`).
- **Gestione tag** — form separato con le stesse modalità `create`/`edit`. La cancellazione di un tag mostra un `confirm` esplicito che avverte della rimozione da tutti i prodotti associati.
- **Ricerca prodotti** — `searchControl` (FormControl standalone) applica `debounceTime(400)` e `distinctUntilChanged()` prima di invocare `productApi.list({ title })`, evitando chiamate al server a ogni carattere digitato.
</details>


<details>
<summary><strong>Storico ordini avanzato</strong></summary>
<br>
Pagina "I miei ordini" accessibile solo a utenti autenticati (`authGuard` su `/orders`). Permette di filtrare, ordinare e consultare il dettaglio di ogni ordine.

**Backend**

`OrdersController` richiede `authenticate_customer!` su tutte le action. `set_order` usa `current_customer.orders.find(...)` invece di `Order.find(...)`, impedendo a un customer di accedere agli ordini di un altro anche conoscendone l'ID.

La `index` applica quattro scope concatenabili definiti nel modello `Order`:

| Scope | Parametro | Logica |
|---|---|---|
| `search_by_min_max_total` | `min`, `max` | `WHERE total >= min AND total <= max` — ogni bound è opzionale |
| `search_by_status` | `status` | `WHERE status = ?` con enum `processing / completed / cancelled` |
| `search_by_year` | `year` | `WHERE extract(year from created_at) = ?` |
| `apply_sort` | `sort` | `dateAsc`, `dateDesc`, `totalAsc`, `totalDesc`; default `dateDesc` |

La risposta include la paginazione `pagy` e, per ogni ordine, gli `order_items` con il titolo del prodotto associato. Il caricamento usa `includes(order_items: :product)` per evitare N+1 query.

**Frontend — OrderPage**

I filtri sono centralizzati in un `BehaviorSubject<filters>`. Ogni aggiornamento (sort, status, year, pagina) chiama `filters$.next(...)` resettando la pagina a 1, tranne il cambio pagina che preserva i filtri correnti.

I filtri per totale minimo e massimo transitano attraverso due `Subject` dedicati con `debounceTime(400)`, così la chiamata HTTP viene ritardata finché l'utente smette di digitare.

`response$` è costruito con `switchMap` su `filters$`: ogni nuova emissione cancella automaticamente la richiesta HTTP precedente ancora in volo. `shareReplay(1)` fa sì che `orders$` e `pagy$` (due pipe derivate dalla stessa sorgente) condividano un'unica chiamata HTTP invece di generarne due.

Gli anni selezionabili sono calcolati dinamicamente da `buildYearList()`: ultimi 5 anni a partire dall'anno corrente, senza valori hardcoded.

**Frontend — OrderCard**

Ogni ordine è un `OrderCard` con dettaglio espandibile (toggle via `expanded` boolean). Collassato mostra data, totale e status; espanso mostra l'elenco completo degli `order_items` con quantità, prezzo unitario e titolo del prodotto, più i dati di spedizione.

Lo status è visualizzato con un `MatChip` a colore contestuale:

| Status | Colore Material |
|---|---|
| `processing` | `accent` |
| `completed` | `primary` |
| `cancelled` | `warn` |

</details>

---

## Testing

La suite usa **Rails Integration Tests** (`ActionDispatch::IntegrationTest`) con `Devise::Test::IntegrationHelpers` per simulare sessioni autenticate. I model test usano `ActiveSupport::TestCase` direttamente, senza stack HTTP.

**SimpleCov** genera un report HTML in `coverage/index.html` al termine di ogni run. La percentuale indica le righe attraversate, non la correttezza logica.

---

<details>
<summary><strong>ProductTest — model test</strong></summary>

<br>

| Test | Cosa verifica |
|---|---|
| `should be valid` | Il prodotto fixture supera tutte le validazioni |
| `should not be valid without a title` | Validazione `presence: true` su `title` |
| `should not be valid without a price` | Validazione `presence: true` su `price` |
| `should not be valid without a description` | Validazione `presence: true` su `description` |
| `search_by_title` | Stringa corrispondente → prodotto; stringa assente → `[]` |
| `search_by_tag` | Tag corrispondente → prodotto; tag assente → `[]` |
| `search_by_sale` | Il prodotto compare/non compare in base al valore di `sale` |
| `search_by_min_max_price` | Range che include il prezzo → prodotto; range che esclude → `[]` |

Gli scope vengono testati con asserzioni simmetriche (caso positivo + negativo nello stesso test) per evitare che uno scope che restituisce sempre tutto il catalogo passi i test.

</details>

<details>
<summary><strong>CartItemsControllerTest</strong></summary>

<br>

| Test | Cosa verifica |
|---|---|
| `should create cart_item` | `POST /carts/:id/cart_items` crea il record → 201 |
| `should update cart_item` | `PATCH /cart_items/:id` aggiorna la quantità → 200 |
| `should destroy cart_item` | `DELETE /cart_items/:id` rimuove il record → 204 |

Il `setup` riassegna il carrello fixture al customer autenticato per evitare che l'autorizzazione lato server rigetti la richiesta.

</details>

<details>
<summary><strong>CartsControllerTest</strong></summary>

<br>

| Test | Cosa verifica |
|---|---|
| `should get index` | `GET /carts` → 200 |
| `should create cart` | `POST /carts` crea il record → 201 |
| `should show cart` | `GET /carts/:id` → 200 |
| `should update cart` | `PATCH /carts/:id` → 200 |
| `should destroy cart` | `DELETE /carts/:id` → 204 |
| `should reject checkout of empty cart` | Checkout con carrello vuoto → 422 |
| `should checkout successfully` | Verifica la transazione completa: +1 `Order`, +N `OrderItem`, -1 `Cart`, totale corretto, status `processing`, shipping name nella risposta |

Il test di checkout usa `assert_difference` annidati per verificare simultaneamente i tre delta sul database, rispecchiando la logica transazionale del controller.

</details>

<details>
<summary><strong>OrdersControllerTest</strong></summary>

<br>

| Test | Cosa verifica |
|---|---|
| `should get index with pagy metadata` | La risposta contiene le chiavi `pagy` e `orders` |
| `should create order` | `POST /orders` → 201 |
| `should show order` | `GET /orders/:id` → 200 |
| `should update order` | `PATCH /orders/:id` aggiorna i campi di spedizione → 200 |
| `should update status` | `PATCH /orders/:id` con `status: "completed"` → status aggiornato nella risposta |
| `should destroy order` | `DELETE /orders/:id` → 204 |
| `should filter orders by year` | `GET /orders?year=2025` restituisce solo gli ordini del 2025, esclude quelli del 2026 |

Il test del filtro per anno usa date fisse (`created_at` esplicito) per essere deterministico e indipendente dalla data di sistema.

</details>

<details>
<summary><strong>ProductsControllerTest</strong></summary>

<br>

| Test | Cosa verifica |
|---|---|
| `should get index` | `GET /products` → 200 |
| `should filter products by tag` | `GET /products?tag=Informatica` → solo prodotti con quel tag |
| `should create product` | `POST /products` con params validi → 201 |
| `should not create product with invalid params` | `POST /products` con `title: nil` → 422, nessun record creato |
| `should show product` | `GET /products/:id` → 200 |
| `should update product` | `PATCH /products/:id` con params validi → 200 |
| `should not update product with invalid params` | `PATCH /products/:id` con `title: ""` → 422 |
| `should destroy product` | `DELETE /products/:id` → 204 |

I test autenticano un `Admin` (non un `Customer`) per riflettere la separazione dei ruoli: le action di scrittura sui prodotti rigetterebbero richieste da un customer.

</details>