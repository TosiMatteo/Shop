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
- [Gestione degli errori](#gestione-degli-errori)
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
Mail inviate con devise-jwt si possono aprire accedendo alla cartella `tmp/mail` del progetto.

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
Il seeding è impostato a 30 prodotti per agevolare macchine più datate, se si vuole aumentare il numero dei prodotti bisogna accedere al file `backend/db/seeds.rb` e andare a modificare la costante `SEED_PRODUCTS_COUNT` con il numero desiderato.

```bash
docker compose exec backend rails db:create db:migrate db:seed
```

> Il seed scarica immagini da `https://picsum.photos`: è richiesta connessione Internet. Un eventuale errore su una singola immagine non blocca il seed.

| Servizio | URL |
|---|---|
| Frontend Angular | `http://localhost:4200` |
| Backend Rails API | `http://localhost:3000` |
| PostgreSQL | `localhost:5432` |

<details>
<summary><strong>Senza Docker</strong></summary>

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
</details>

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
| `simplecov` | test | Misura la percentuale di righe coperte dalla suite di test. Genera un report HTML in `coverage/`. |

</details>

<details>
<summary><strong>Frontend</strong></summary>

<br>

| Pacchetto            | Scopo                       |
|----------------------|-----------------------------|
| `@angular/core 20.x` | Framework SPA               |
| `rxjs`               | Gestione flussi asincroni   |
| SCSS                 | Stile componenti            |
| Chromium             | Browser default per testing |

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
├── e2e/
│   ├── tests/
│   ├── test-results/
│   └── ...
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


## Gestione degli errori

Il sistema adotta un contratto HTTP/JSON condiviso tra backend e frontend: ogni errore viene normalizzato lato Rails e consumato in modo uniforme da Angular.

**Backend (`ErrorHandler`)** — Concern incluso nei controller che intercetta le eccezioni Rails/JWT e le converte sempre nello stesso payload:

```json
{ "error": { "message": "...", "details": ["..."] } }
```

**Frontend (`errorInterceptor`)** — Interceptor HTTP funzionale che aggancia ogni risposta in errore, legge il payload e delega allo `ErrorService` (signal globale). I componenti non gestiscono gli errori localmente: l'Observable viene terminato con `EMPTY` e lo stato reattivo aggiornato viene letto dall'`ErrorBanner`, visibile in ogni layout.

L'errore viene azzerato automaticamente a ogni navigazione tramite `NavigationStart`.

| Codice | Causa | Comportamento frontend |
|---|---|---|
| `0` | Rete/server non raggiungibile | Per richieste `GET` il client riprova automaticamente la connessione **fino a 3 volte**. Se fallisce ancora, mostra banner: *"server not available"* |
| `400` | Parametro mancante o malformato | Banner con messaggio |
| `401` | Sessione scaduta o token non valido | Pulizia sessione + redirect a `/login` o `/admin/login`. **Eccezione:** su `/sign_in` l'errore viene rilanciato al form di login |
| `403` | Accesso negato | Redirect a `/forbidden` (solo contesto utente); in area admin rimane in-place |
| `404` | Risorsa non trovata | Banner con messaggio |
| `422` | Errori di validazione | Banner con messaggio + lista dettagliata dei campi |
| `500` | Errore interno Rails | Banner con messaggio generico (dettaglio loggato server-side) |

---


## Funzionalità avanzate

<details>
<summary><strong>Area Admin — gestione prodotti e tag</strong></summary>
<br>
Sezione riservata per creare, modificare ed eliminare prodotti e tag. La protezione opera su due livelli indipendenti.

**Backend**

`Admins::SessionsController` e `Admins::PasswordsController` gestiscono autenticazione e reset password su endpoint separati da quelli del customer (`/api/admins/sign_in`, `/api/admins/password`). Il token JWT emesso al login identifica il ruolo admin e viene validato dal `before_action :authenticate_admin!` presente in `ProductsController` e `TagsController` sulle sole action di scrittura (`create`, `update`, `destroy`). Le action di lettura (`index`, `show`) rimangono pubbliche.
Gli admin non vengono creati tramite api pubblica, ma devono essere creati manualmente da console.

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

Gli anni selezionabili sono calcolati dinamicamente da `buildYearList()` controllando l'anno di creazione dell'account del customer.

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

Il progetto è coperto da test su tre livelli:

- **Backend Rails** – model e integration test
- **Frontend Angular** – unit test di componenti, servizi e guardie
- **End‑to‑end** – scenari utente completi con Playwright

---

### Backend (Rails)

La suite usa **Rails Integration Tests** (`ActionDispatch::IntegrationTest`) con `Devise::Test::IntegrationHelpers` per simulare sessioni autenticate. I model test usano `ActiveSupport::TestCase` direttamente, senza stack HTTP.

**SimpleCov** genera un report HTML in `coverage/index.html` al termine di ogni run.

**Comandi principali**

Per eseguire tutti i test:
```
rails test
```

Per eseguire un test specifico:
```
rails test test/models/product_test.rb
```

<details>
<summary><strong>ProductTest — model test</strong></summary>

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


| Test | Cosa verifica |
|---|---|
| `should create cart_item` | `POST /carts/:id/cart_items` crea il record → 201 |
| `should update cart_item` | `PATCH /cart_items/:id` aggiorna la quantità → 200 |
| `should destroy cart_item` | `DELETE /cart_items/:id` rimuove il record → 204 |

Il `setup` riassegna il carrello fixture al customer autenticato per evitare che l'autorizzazione lato server rigetti la richiesta.

</details>

<details>
<summary><strong>CartsControllerTest</strong></summary>


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

---

### Frontend (Angular)

I test Angular utilizzano **Karma** e **Jasmine**. Vengono eseguiti all'interno del container Docker con un browser Chromium headless.

I test coprono:
- Componenti standalone (con input, routing, form)
- Servizi (`ProductApi`, `OrderService`, `CartService`, `AuthService`)
- Guardie (`authGuard`, `adminGuard`)
- Interfacce e comportamenti (es. validazione form, trim dei campi, navigazione)

**Comandi principali**

Compila e esegui i test:
```
ng test --watch=false
```

Aggiungere -code--coverage per generare un report HTML in `coverage/angular/index.html`

Eseguire un test specifico:
```
ng test --watch=false --include="**/"nome_file_test".spec.ts"
```

<details>
<summary><strong>product-service — servizio Angular</strong></summary>

| Test | Cosa verifica |
|---|---|
| `should be created` | Il servizio viene iniettato correttamente |
| `should GET products without filters` | `list({})` chiama `GET /api/products` senza parametri, restituisce paginazione e prodotti |
| `should pass all active filters as query params` | I filtri attivi (tag, title, min, max, sale, sort, page, limit) vengono serializzati correttamente nella query string |
| `should exclude null/empty filters` | I filtri `null` o vuoti non compaiono nella query string (es. solo `min=10&page=1`) |
| `should convert price and original_price to numbers` | I prezzi ricevuti come stringhe dal backend vengono convertiti in `number` |
| `should POST with FormData` | `create()` invia una richiesta `POST /api/products` con il corpo `FormData` |
| `should PATCH product by id with FormData` | `update()` invia una richiesta `PATCH /api/products/:id` con il corpo `FormData` e restituisce il prodotto aggiornato |
| `should DELETE product by id` | `delete()` invia una richiesta `DELETE /api/products/:id` |

I test usano `HttpTestingController` per mockare le richieste HTTP, verificando metodo, URL, parametri e corpo senza chiamare il server reale.

</details>

<details>
<summary><strong>tag-service — servizio Angular</strong></summary>

| Test | Cosa verifica |
|---|---|
| `should be created` | Il servizio viene iniettato correttamente |
| `should GET all tags` | `list()` chiama `GET /api/tags` e restituisce l'array di tag |
| `should POST a new tag` | `create()` invia `POST /api/tags` con il corpo `{ tag: { name } }` e restituisce il tag creato |
| `should PATCH an existing tag` | `update()` invia `PATCH /api/tags/:id` con il nuovo nome e restituisce il tag aggiornato |
| `should DELETE a tag by id` | `delete()` invia `DELETE /api/tags/:id` |

I test usano `HttpTestingController` per mockare le richieste HTTP, verificando metodo, URL e corpo.

</details>

<details>
<summary><strong>auth-guard — guardia Angular</strong></summary>

| Test | Cosa verifica |
|---|---|
| `should be created` | La funzione `authGuard` è definita e può essere eseguita |
| `should return true when user is authenticated` | Se `AuthService.isAuthenticated()` restituisce `true`, la navigazione viene consentita |
| `should redirect to /login when user is not authenticated` | Se `AuthService.isAuthenticated()` restituisce `false`, la guardia reindirizza all'URL `/login` |

La guardia usa `TestBed.runInInjectionContext` per eseguire la funzione nel contesto di iniezione Angular, consentendo di testare il comportamento senza montare un componente.

</details>

<details>
<summary><strong>admin-guard — guardia Angular</strong></summary>

| Test | Cosa verifica |
|---|---|
| `should be created` | La funzione `adminGuard` è definita e può essere eseguita |
| `should return true when user is authenticated and is admin` | Se l'utente è autenticato **e** ha ruolo admin, la navigazione viene consentita |
| `should redirect to /admin/login when user is not authenticated` | Se l'utente non è autenticato, viene reindirizzato alla pagina di login admin (`/admin/login`) |
| `should redirect to /forbidden when user is authenticated but not admin` | Se l'utente è autenticato ma non ha ruolo admin, viene reindirizzato alla pagina di accesso negato (`/forbidden`) |

La guardia distingue tre casi: accesso consentito, login mancante e privilegi insufficienti, verificando sia l'autenticazione che il ruolo.

</details>

<details>
<summary><strong>login-page — componente Angular</strong></summary>

| Test | Cosa verifica |
|---|---|
| `should create` | Il componente viene creato correttamente |
| **loginForm** | |
| `should be invalid when empty` | Il form di login è invalido se vuoto (campi required) |
| `should be invalid with a malformed email` | Il campo email respinge valori non validi (es. `not-an-email`) |
| `should be valid with correct email and password` | Il form è valido con email e password corretti |
| **onLogin()** | |
| `should not call authService.login() when form is invalid` | Se il form non è valido, non viene chiamato il servizio di login |
| `should call authService.login() and navigate to /dashboard on success` | Con form valido, chiama `AuthService.login` e naviga a `/dashboard` |
| **passwordMatchValidator** | |
| `should set passwordMismatch error when passwords do not match` | Il validatore cross‑field imposta l'errore quando le password differiscono |
| `should clear passwordMismatch error when passwords match` | Il validatore rimuove l'errore quando le password coincidono |
| **registerForm** | |
| `should be invalid when empty` | Il form di registrazione è invalido se vuoto |
| `should be invalid when first_name contains only whitespace` | Il campo nome respinge stringhe composte solo da spazi (pattern `\S`) |
| **onRegister()** | |
| `should not call authService.register() when form is invalid` | Se il form non è valido, non viene chiamato il servizio di registrazione |
| `should call authService.register() with trimmed payload on valid submit` | I campi `first_name`, `last_name`, `email` vengono trimmati prima dell'invio; la chiamata include il payload pulito |
| `should set registrationPending and registrationMessage on success` | Dopo registrazione riuscita, il componente mostra il messaggio di conferma (`registrationPending = true`) |
| `should reset the form after successful registration` | Il form viene resettato (pristine) dopo una registrazione riuscita |

Il test mocka `AuthService` e verifica sia la logica di validazione che l'integrazione con il servizio.
</details>

<details>
<summary><strong>product-page — componente Angular</strong></summary>

| Test | Cosa verifica |
|---|---|
| `should create` | Il componente viene creato correttamente |
| **filters$ initial state** | |
| `should initialise with correct default values` | Il BehaviorSubject `filters$` parte con i valori predefiniti (title vuoto, sort `dateDesc`, filtri prezzo/null, tag null, page 1, limit 12) |
| **updateTitle()** | |
| `should update title and reset page to 1` | Chiamando `updateTitle` il filtro `title` si aggiorna e la pagina torna a 1 |
| `should call ProductApi.list() with updated title after debounce` | Dopo il debounce (300ms), il servizio `ProductApi.list` viene chiamato con il nuovo titolo |
| **updateSort()** | |
| `should update sort and reset page to 1` | Cambiando ordinamento (`priceAsc`) si aggiorna il filtro e si resetta la pagina |
| **updatePriceMin()** | |
| `should set min price from a valid number` | Imposta correttamente il filtro `min` con un numero valido |
| `should set min price to null for empty string` | Se la stringa è vuota, `min` diventa `null` |
| `should set min price to null for a non-numeric string` | Se il valore non è un numero, `min` diventa `null` |
| `should reset page to 1 when min price changes` | La modifica del prezzo minimo resetta la pagina a 1 |
| **updatePriceMax()** | |
| `should set max price from a valid number` | Imposta correttamente il filtro `max` con un numero valido |
| `should set max price to null for empty string` | Se la stringa è vuota, `max` diventa `null` |
| `should not overwrite min when max changes` | Cambiando `max` non si modifica il valore di `min` già impostato |
| **updateSale()** | |
| `should set saleFilter to true and reset page to 1` | Attivando il filtro "in offerta" si aggiorna il flag e si resetta la pagina |
| `should set saleFilter back to false` | È possibile disattivare il filtro sale |
| **updateTags()** | |
| `should set tag and reset page to 1` | Selezionando un tag si aggiorna il filtro e si resetta la pagina |
| `should set tag to null when called with null` | Passando `null` si resetta il filtro tag |
| **onPage()** | |
| `should convert 0-based pageIndex to 1-based backend page` | L'evento paginatore converte l'indice 0‑based in pagina 1‑based |
| `should update limit from pageSize` | Il `pageSize` del paginatore aggiorna il filtro `limit` |

I test mockano `ProductApi` e `TagService` e utilizzano `fakeAsync` per controllare i debounce.
</details>

<details>
<summary><strong>order-page — componente Angular</strong></summary>

| Test | Cosa verifica |
|---|---|
| `should create` | Il componente viene creato correttamente |
| **filters$ initial state** | |
| `should initialise with correct default values` | Il BehaviorSubject `filters$` parte con i valori predefiniti (totalFilter con min/max null, sort `dateDesc`, status null, year null, page 1, limit 10) |
| **availableYears** | |
| `should start from the current year` | Il primo elemento dell'array `availableYears` è l'anno corrente |
| `should fall back to 5 years when getMemberSince() returns null` | Se `getMemberSince` restituisce `null`, vengono mostrati gli ultimi 5 anni |
| `should use getMemberSince() to determine the oldest year in the list` | Se l'utente è membro da un anno specifico, la lista parte da quell'anno (es. 3 anni totali) |
| **updateSort()** | |
| `should update sort and reset page to 1` | Cambiando ordinamento (`dateAsc`) si aggiorna il filtro e si resetta la pagina |
| **updateStatus()** | |
| `should update status and reset page to 1` | Selezionando uno stato (`completed`) si aggiorna il filtro e si resetta la pagina |
| `should set status to null when cleared` | Passando `null` si resetta il filtro stato |
| **updateYear()** | |
| `should update year and reset page to 1` | Selezionando un anno si aggiorna il filtro e si resetta la pagina |
| `should set year to null when cleared` | Passando `null` si resetta il filtro anno |
| **onPage()** | |
| `should convert 0-based pageIndex to 1-based backend page` | L'evento paginatore converte l'indice 0‑based in pagina 1‑based |
| `should update limit from pageSize` | Il `pageSize` del paginatore aggiorna il filtro `limit` |
| **updateMinTotal()** | |
| `should update totalFilter.min after debounce and reset page to 1` | Dopo il debounce (400ms), il filtro `min` viene aggiornato e la pagina resettata |
| `should set min to null when input is empty after debounce` | Se l'input è vuoto, dopo il debounce `min` diventa `null` |
| **updateMaxTotal()** | |
| `should update totalFilter.max after debounce and reset page to 1` | Dopo il debounce, il filtro `max` viene aggiornato e la pagina resettata |
| `should not overwrite min when max changes` | Cambiando `max` non si modifica il valore di `min` già impostato |

I test mockano `OrderService` e `AuthService` e utilizzano `fakeAsync` per controllare i debounce dei filtri totali.
</details>



---

### E2E (Playwright)

I test E2E sono scritti con **Playwright** e simulano flussi utente completi.
Vengono eseguiti in un container separato (profilo `e2e`) che comunica con il backend e il frontend attraverso la rete Docker.

Prima di ogni run, il `globalSetup` esegue automaticamente due operazioni:

- Attende che il frontend Angular (`http://frontend:4200`) sia raggiungibile
- Resetta il database tramite `GET /test/reset` per garantire uno stato deterministico, utilizza il file testseed

**Comandi principali**

Eseguire i test:
```
docker compose --profile e2e run --rm playwright
```

Eseguire i test in modalità ui visitando localhost:8080
```
docker compose --profile e2e run --rm -p 8080:8080 playwright npx playwright test --ui --ui-host=0.0.0.0 --ui-port=8080
```

I report di screenshot e video vengono salvati in `test-results/` solo in caso di fallimento (`screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`).

<details>
<summary><strong>login-order — flussi di autenticazione e acquisto</strong></summary>

| Test | Cosa verifica |
|---|---|
| `utente autenticato vede la lista prodotti` | Esegue il login e verifica che la route `/products` carichi almeno un `app-product-card` visibile |
| `login → aggiungi al carrello → checkout → ordine confermato` | Flusso completo: login → aggiunta del primo prodotto al carrello → navigazione a `/cart` → checkout → compilazione form di spedizione → conferma ordine → verifica del banner "Ordine confermato!" |

Il test di checkout compila i campi `firstName`, `lastName`, `street`, `city`, `zip` tramite `formControlName` e accetta i termini cliccando il testo del `mat-checkbox`, poiché il componente Material non espone un `<label>` standard.

L'helper `login()` condiviso tra i test aspetta che `mat-tab-group` sia visibile (timeout 30s) prima di interagire, per gestire il bootstrap lento di Angular in ambiente Docker.

</details>