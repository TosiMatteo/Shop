# Architettura — Shop App

---

## Stack tecnologico

Il progetto segue un'architettura client-server classica con separazione netta tra backend e frontend.

Il **backend** è un'applicazione Rails 8 in modalità API-only. Espone endpoint REST sotto il prefisso `/api/` e gestisce autenticazione, logica di business, persistenza su PostgreSQL e upload di immagini tramite Active Storage.

Il **frontend** è una Single Page Application Angular 20 che comunica col backend tramite HTTP. In sviluppo il proxy di Angular (`proxy.conf.json`) redirige le chiamate `/api/*` verso `localhost:3000`, eliminando problemi CORS durante lo sviluppo locale.

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

#### Produzione

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

#### Development e Test

| Gem | Gruppo | Scopo |
|---|---|---|
| `debug` | development, test | Debugger interattivo integrato in Ruby 3.x; si aggancia al processo Rails e permette breakpoint con `binding.break` o `debugger`. Sostituisce `byebug`. Richiesto solo su MRI e Windows. |
| `bundler-audit` | development, test | Controlla il `Gemfile.lock` contro il database CVE di Ruby Advisory. Da eseguire in CI (`bundle exec bundler-audit check --update`) per rilevare gem con vulnerabilità note prima del deploy. |
| `brakeman` | development, test | Analisi statica del codice Rails per individuare vulnerabilità di sicurezza (SQL injection, XSS, mass assignment, ecc.) senza eseguire l'applicazione. Integrato nel workflow di revisione. |
| `rubocop-rails-omakase` | development, test | Linter di stile basato sulla configurazione Omakase di Rails (Basecamp). Garantisce coerenza stilistica e individua pattern Ruby/Rails non idiomatici. |
| `faker` | development, test | Generazione di dati fittizi realistici (nomi, indirizzi, prezzi, testi) per i seed del database e le fixtures dei test. |
| `letter_opener` | development | Intercetta le email in uscita durante lo sviluppo locale e le apre nel browser invece di inviarle. Utile per testare le email Devise (conferma account, reset password) senza un server SMTP reale. |
| `simplecov` | test | Misura la percentuale di righe di codice coperte dalla suite di test. Genera un report HTML in `coverage/`. Configurato con `require: false` e attivato esplicitamente all'inizio del `test_helper.rb`. |

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

Dopo un checkout, il carrello viene cancellato e i relativi `CartItem` vengono eliminati.

### CartItem

Riga del carrello: `belongs_to :cart`, `belongs_to :product`, con campo `quantity`. Valida l'unicità di `product_id` per `cart_id` (non si possono avere due righe per lo stesso prodotto nello stesso carrello; un secondo `addItem` incrementa la quantità esistente).

### Order

Ordine creato al completamento del checkout. Campi: `total`, `status` (enum, parte da `processing`), dati di spedizione (`shipping_name`, `shipping_street`, `shipping_city`, `shipping_zip`), `customer_id`. Ha `has_many :order_items`.

### OrderItem

Snapshot del prodotto al momento dell'acquisto: `product_id`, `quantity`, `unit_price` (copiato da `product.price` al momento del checkout, immune a future variazioni di prezzo).

---

## Flusso principale: prodotti → login → carrello → checkout → ordine

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

Permette all'utente di fare shopping senza registrarsi e di non perdere il carrello al momento dell'accesso. Il pattern usa un `Subject<void>` in `AuthService` per disaccoppiare il servizio di autenticazione da quello del carrello, evitando dipendenze circolari.

### Gestione immagini con Active Storage e varianti

Le immagini dei prodotti vengono caricate tramite Active Storage con `has_one_attached :thumbnail`. In lettura vengono servite come varianti ridimensionate (`resize_to_limit: [300, 300]`) tramite `rails_representation_path`, con lazy generation della variante al primo accesso. Il controller include esplicitamente `thumbnail_attachment: { blob: :variant_records }` per evitare N+1 query sul catalogo.

### Rate limiting

`rack-attack` è configurato per proteggere le API da abusi (brute force su login, flood di richieste). Le regole di throttling sono definite in `config/initializers/rack_attack.rb`.

### Separazione dei ruoli Customer / Admin

I due ruoli sono modelli distinti con tabelle, endpoint di autenticazione e token separati. Gli endpoint di scrittura sui prodotti (`create`, `update`, `destroy`) richiedono `authenticate_admin!`; le action del carrello richiedono `authenticate_customer!`. Un admin non può operare sul carrello e viceversa.

---

## Testing

### Strumenti

La suite di test utilizza **Rails Integration Tests** (`ActionDispatch::IntegrationTest`) con `Devise::Test::IntegrationHelpers` per simulare sessioni autenticate. I test sono di tipo integration (non unit) perché verificano il comportamento dell'intero stack HTTP: routing, controller, model e risposta JSON.

**SimpleCov** è attivato all'inizio di `test_helper.rb` e produce un report HTML in `coverage/index.html` al termine di ogni run. La percentuale di copertura indica quante righe del codice applicativo vengono attraversate durante i test; non garantisce la correttezza della logica, ma evidenzia parti di codice mai esercitate.

### CartItemsControllerTest

Copre le tre operazioni principali sugli item del carrello.

| Test | Cosa verifica |
|---|---|
| `should create cart_item` | `POST /carts/:id/cart_items` crea un nuovo record e risponde 201 |
| `should update cart_item` | `PATCH /cart_items/:id` aggiorna la quantità e risponde 200 |
| `should destroy cart_item` | `DELETE /cart_items/:id` rimuove il record e risponde 204 |

Il `setup` assegna il carrello fixture al customer autenticato (`@cart.update!(customer: @customer)`) per garantire che l'autorizzazione lato server non rigetti la richiesta.

### CartsControllerTest

Copre CRUD completo del carrello più i due percorsi critici del checkout.

| Test | Cosa verifica |
|---|---|
| `should get index` | `GET /carts` risponde 200 |
| `should create cart` | `POST /carts` crea un record e risponde 201 |
| `should show cart` | `GET /carts/:id` risponde 200 |
| `should update cart` | `PATCH /carts/:id` risponde 200 |
| `should destroy cart` | `DELETE /carts/:id` rimuove il record e risponde 204 |
| `should reject checkout of empty cart` | Checkout con carrello svuotato risponde 422 |
| `should checkout successfully` | Verifica l'intera transazione: creazione `Order`, creazione degli `OrderItem` (uno per item), distruzione del `Cart`, totale corretto, status `processing`, shipping name nella risposta JSON |

Il test di checkout usa `assert_difference` annidati per verificare simultaneamente i tre delta sul database in una singola transazione, rispecchiando la logica transazionale del controller.

### OrdersControllerTest

Copre CRUD degli ordini, il filtraggio per anno e la modifica dello status.

| Test | Cosa verifica |
|---|---|
| `should get index with pagy metadata` | La risposta contiene le chiavi `pagy` e `orders` |
| `should create order` | `POST /orders` crea un record e risponde 201 |
| `should show order` | `GET /orders/:id` risponde 200 |
| `should update order` | `PATCH /orders/:id` aggiorna i campi di spedizione e risponde 200 |
| `should update status` | `PATCH /orders/:id` con `status: "completed"` aggiorna lo status e lo restituisce nella risposta |
| `should destroy order` | `DELETE /orders/:id` rimuove il record e risponde 204 |
| `should filter orders by year` | `GET /orders?year=2025` restituisce solo gli ordini del 2025, escludendo quelli del 2026 |

Il test del filtro per anno crea esplicitamente due ordini con `created_at` fisso in anni diversi, poi verifica che l'ID dell'ordine 2026 non compaia nella risposta. Questo approccio è deterministico e non dipende dalla data di sistema.

### ProductTest (model test)

L'unico test di tipo model della suite. Usa `ActiveSupport::TestCase` direttamente, senza stack HTTP, il che lo rende più veloce e più preciso nell'isolare la logica del modello da quella del controller.

| Test | Cosa verifica                                                                                              |
|---|------------------------------------------------------------------------------------------------------------|
| `should be valid` | Il prodotto fixture di partenza supera tutte le validazioni                                                |
| `should not be valid without a title` | La validazione `presence: true` su `title` è attiva                                                        |
| `should not be valid without a price` | La validazione `presence: true` su `price` è attiva                                                        |
| `should not be valid without a description` | La validazione `presence: true` su `description` è attiva                                                  |
| `search_by_title` | Con stringa corrispondente restituisce il prodotto; con stringa non corrispondente restituisce array vuoto |
| `search_by_tag` | Con tag corrispondente restituisce il prodotto; con tag assente restituisce array vuoto                    |
| `search_by_sale` | Il prodotto compare in `search_by_sale(false)` e non compare in `search_by_sale(true)`                     |
| `search_by_min_max_price` | Range che include il prezzo restituisce il prodotto; range che esclude il prezzo restituisce array vuoto   |

Gli scope vengono testati con asserzioni simmetriche (caso positivo e caso negativo nello stesso test), il che aumenta la confidenza che lo scope non restituisca semplicemente tutto il catalogo per qualsiasi input.

### ProductsControllerTest

Copre CRUD dei prodotti con autenticazione admin e i casi di validazione fallita.

| Test | Cosa verifica |
|---|---|
| `should get index` | `GET /products` risponde 200 |
| `should filter products by tag` | `GET /products?tag=Informatica` restituisce solo i prodotti con quel tag |
| `should create product` | `POST /products` con params validi crea un record e risponde 201 |
| `should not create product with invalid params` | `POST /products` con `title: nil` non crea il record e risponde 422 |
| `should show product` | `GET /products/:id` risponde 200 |
| `should update product` | `PATCH /products/:id` con params validi risponde 200 |
| `should not update product with invalid params` | `PATCH /products/:id` con `title: ""` risponde 422 |
| `should destroy product` | `DELETE /products/:id` rimuove il record e risponde 204 |

I test autenticano un `Admin` (non un `Customer`) per riflettere la separazione dei ruoli: le action di scrittura sui prodotti rifiuterebbero richieste provenienti da un customer.