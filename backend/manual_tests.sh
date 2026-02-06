#!/bin/bash
# manual_tests.sh - Script per testare manualmente tutti gli endpoint
# Esegui nel container Docker: docker exec -it <container_name> bash manual_tests.sh

API_URL="http://localhost:3000/api"
HEADERS="Content-Type: application/json"

# --- PULIZIA PRELIMINARE ---
echo ""
info "🧹 Pulizia ambiente di test..."
# Rimuove le vecchie email generate da letter_opener
if [ -d "tmp/letter_opener" ]; then
    rm -rf tmp/mails/*
    success "Cartella tmp/letter_opener svuotata"
else
    info "Cartella tmp/letter_opener non trovata (verrà creata se necessario)"
fi
echo ""

echo "🧪 TEST MANUALI AUTENTICAZIONE DEVISE-JWT"
echo "=========================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per stampare successo
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Funzione per stampare errore
error() {
    echo -e "${RED}✗${NC} $1"
}

# Funzione per stampare info
info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

echo "1️⃣  TEST CUSTOMER REGISTRATION"
echo "------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/customers" \
  -H "$HEADERS" \
  -d '{
    "customer": {
      "email": "test_'$(date +%s)'@example.com",
      "password": "Password123!",
      "password_confirmation": "Password123!",
      "first_name": "Test",
      "last_name": "User"
    }
  }')

if echo "$REGISTER_RESPONSE" | grep -q '"user_type":"Customer"'; then
    success "Customer creato con successo"
    CUSTOMER_EMAIL=$(echo "$REGISTER_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
    info "Email: $CUSTOMER_EMAIL"
else
    error "Errore creazione customer"
    echo "$REGISTER_RESPONSE"
fi
echo ""

echo "2️⃣  TEST CUSTOMER LOGIN (con customer confermato dai seeds)"
echo "------------------------------------------------------------"
LOGIN_RESPONSE=$(curl -s -i -X POST "$API_URL/customers/sign_in" \
  -H "$HEADERS" \
  -d '{
    "customer": {
      "email": "mario.rossi@example.com",
      "password": "Password123!"
    }
  }')

if echo "$LOGIN_RESPONSE" | grep -q "HTTP/.*200"; then
    success "Login customer effettuato con successo"
    
    # Estrai token dall'header Authorization
    CUSTOMER_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -i "Authorization: Bearer" | sed 's/.*Bearer //' | tr -d '\r')
    
    if [ -n "$CUSTOMER_TOKEN" ]; then
        success "Token JWT estratto: ${CUSTOMER_TOKEN:0:20}..."
    else
        error "Token non trovato nella response"
    fi
else
    error "Login customer fallito"
    echo "$LOGIN_RESPONSE"
fi
echo ""

echo "3️⃣  TEST GET CURRENT USER"
echo "-------------------------"
if [ -n "$CUSTOMER_TOKEN" ]; then
    ME_RESPONSE=$(curl -s -X GET "$API_URL/me" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if echo "$ME_RESPONSE" | grep -q '"email":"mario.rossi@example.com"'; then
        success "GET /me funziona correttamente"
        info "User: $(echo "$ME_RESPONSE" | grep -o '"first_name":"[^"]*' | cut -d'"' -f4) $(echo "$ME_RESPONSE" | grep -o '"last_name":"[^"]*' | cut -d'"' -f4)"
    else
        error "GET /me fallito"
        echo "$ME_RESPONSE"
    fi
else
    error "Saltato - nessun token disponibile"
fi
echo ""

echo "4️⃣  TEST ADMIN LOGIN"
echo "--------------------"
ADMIN_LOGIN_RESPONSE=$(curl -s -i -X POST "$API_URL/admins/sign_in" \
  -H "$HEADERS" \
  -d '{
    "admin": {
      "email": "admin@example.com",
      "password": "AdminPassword123!"
    }
  }')

if echo "$ADMIN_LOGIN_RESPONSE" | grep -q "HTTP/.*200"; then
    success "Login admin effettuato con successo"
    
    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | grep -i "Authorization: Bearer" | sed 's/.*Bearer //' | tr -d '\r')
    
    if [ -n "$ADMIN_TOKEN" ]; then
        success "Token admin estratto: ${ADMIN_TOKEN:0:20}..."
    fi
else
    error "Login admin fallito"
    echo "$ADMIN_LOGIN_RESPONSE"
fi
echo ""

echo "5️⃣  TEST GET CURRENT USER (ADMIN)"
echo "----------------------------------"
if [ -n "$ADMIN_TOKEN" ]; then
    ADMIN_ME_RESPONSE=$(curl -s -X GET "$API_URL/me" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$ADMIN_ME_RESPONSE" | grep -q '"user_type":"Admin"'; then
        success "GET /me con token admin funziona"
        info "Admin email: $(echo "$ADMIN_ME_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)"
    else
        error "GET /me con token admin fallito"
        echo "$ADMIN_ME_RESPONSE"
    fi
else
    error "Saltato - nessun token admin disponibile"
fi
echo ""

echo "6️⃣  TEST PASSWORD RESET REQUEST"
echo "--------------------------------"
RESET_RESPONSE=$(curl -s -X POST "$API_URL/customers/password" \
  -H "$HEADERS" \
  -d '{
    "customer": {
      "email": "mario.rossi@example.com"
    }
  }')

if echo "$RESET_RESPONSE" | grep -q '"message"'; then
    success "Password reset richiesto con successo"
    info "Controlla tmp/letter_opener per l'email"
else
    error "Password reset fallito"
    echo "$RESET_RESPONSE"
fi
echo ""

echo "7️⃣  TEST LOGOUT CUSTOMER"
echo "------------------------"
if [ -n "$CUSTOMER_TOKEN" ]; then
    LOGOUT_RESPONSE=$(curl -s -X DELETE "$API_URL/customers/sign_out" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if echo "$LOGOUT_RESPONSE" | grep -q "Logout"; then
        success "Logout effettuato con successo"
        
        # Testa che il token non funzioni più
        TEST_AFTER_LOGOUT=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/me" \
          -H "Authorization: Bearer $CUSTOMER_TOKEN")
        
        if [ "$TEST_AFTER_LOGOUT" = "401" ]; then
            success "Token revocato correttamente (401 dopo logout)"
        else
            error "Token ancora valido dopo logout (PROBLEMA!)"
        fi
    else
        error "Logout fallito"
        echo "$LOGOUT_RESPONSE"
    fi
else
    error "Saltato - nessun token customer disponibile"
fi
echo ""

echo "8️⃣  TEST LOGIN FALLITO (credenziali errate)"
echo "--------------------------------------------"
WRONG_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/customers/sign_in" \
  -H "$HEADERS" \
  -d '{
    "customer": {
      "email": "mario.rossi@example.com",
      "password": "WrongPassword!"
    }
  }')

if [ "$WRONG_LOGIN" = "401" ]; then
    success "Login con password errata correttamente rifiutato (401)"
else
    error "Login con password errata non ha restituito 401 (ha restituito $WRONG_LOGIN)"
fi
echo ""

echo "9️⃣  TEST LOGIN CON ACCOUNT NON CONFERMATO"
echo "------------------------------------------"
# 1. Creiamo un utente nuovo apposta per questo test
EMAIL_UNCONFIRMED="fresh_unconfirmed_$(date +%s)@test.com"
curl -s -X POST "$API_URL/customers" \
  -H "$HEADERS" \
  -d '{
    "customer": {
      "email": "'$EMAIL_UNCONFIRMED'",
      "password": "Password123!",
      "password_confirmation": "Password123!",
      "first_name": "Test",
      "last_name": "Unconfirmed"
    }
  }' > /dev/null

# 2. Proviamo a fare login subito (dovrebbe fallire)
UNCONFIRMED_LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/customers/sign_in" \
  -H "$HEADERS" \
  -d '{
    "customer": {
      "email": "'$EMAIL_UNCONFIRMED'",
      "password": "Password123!"
    }
  }')

if [ "$UNCONFIRMED_LOGIN_CODE" = "401" ]; then
    success "Login con account non confermato correttamente bloccato (401)"
else
    error "ERRORE GRAVE: Login consentito a utente non confermato! (Codice: $UNCONFIRMED_LOGIN_CODE)"
fi

echo ""

echo "🔟  TEST GET /me SENZA TOKEN"
echo "----------------------------"
NO_TOKEN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/me")

if [ "$NO_TOKEN_RESPONSE" = "401" ]; then
    success "Richiesta senza token correttamente bloccata (401)"
else
    error "Richiesta senza token non ha restituito 401 (ha restituito $NO_TOKEN_RESPONSE)"
fi
echo ""

echo "=========================================="
echo "✅ TEST COMPLETATI"
echo ""
echo "📝 Note:"
echo "  - Tutti i test sono passati se vedi solo ✓"
echo "  - Email di password reset in: tmp/letter_opener/"
echo "  - Per test più completi, esegui: bundle exec rspec"
echo ""
