# test/controllers/customers_controller_test.rb
require "test_helper"

class CustomersControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @confirmed = customers(:Customer_Auth)           # Mario Rossi, confermato
    @unconfirmed = customers(:Customer_NoAuth)       # Giulia Bianchi, NON confermata
    @valid_sign_up_params = {
      customer: {
        email: "nuovo@example.com",
        password: "Password123!",
        password_confirmation: "Password123!",
        first_name: "Nuovo",
        last_name: "Utente"
      }
    }
    @invalid_params = {
      customer: {
        email: "non-valida",
        password: "short",
        password_confirmation: "short",
        first_name: "",
        last_name: ""
      }
    }
  end

  # ──────────────────────────────────────────────────────────────
  # Registrations
  # ──────────────────────────────────────────────────────────────

  test "should register a new customer (pending confirmation)" do
    assert_difference("Customer.count", 1) do
      post "/api/customers", params: @valid_sign_up_params, as: :json
    end
    assert_response :created
    json = JSON.parse(response.body)
    # Con Devise :confirmable, il nuovo utente non è attivo subito.
    assert_equal "Registrazione completata. Controlla la tua email per confermare l'account.", json["message"]
    assert_equal "nuovo@example.com", json["user"]["email"]
    assert_equal "Customer", json["user"]["user_type"]
  end

  test "should not register with invalid data" do
    assert_no_difference("Customer.count") do
      post "/api/customers", params: @invalid_params, as: :json
    end
    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_includes json["error"], "message"
  end

  test "should not allow duplicate email" do
    duplicate_params = {
      customer: {
        email: @confirmed.email,
        password: "Password123!",
        password_confirmation: "Password123!",
        first_name: "Doppio",
        last_name: "Utente"
      }
    }
    assert_no_difference("Customer.count") do
      post "/api/customers", params: duplicate_params, as: :json
    end
    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    # Ora il formato è { error: { message: "...", details: [...] } }
    assert_equal "Validation failed", json["error"]["message"]
    assert_includes json["error"]["details"].first, "Email"
  end

  # ──────────────────────────────────────────────────────────────
  # Sessions (login / logout)
  # ──────────────────────────────────────────────────────────────

  test "should login with valid confirmed customer" do
    post "/api/customers/sign_in", params: {
      customer: {
        email: @confirmed.email,
        password: "password"
      }
    }, as: :json
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Login effettuato con successo", json["message"]
    assert_equal @confirmed.email, json["user"]["email"]
  end

  test "should not login with wrong password" do
    post "/api/customers/sign_in", params: {
      customer: {
        email: @confirmed.email,
        password: "sbagliata"
      }
    }, as: :json
    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert json["error"].present?
  end

  test "should not login with unconfirmed account" do
    post "/api/customers/sign_in", params: {
      customer: {
        email: @unconfirmed.email,
        password: "password"
      }
    }, as: :json
    assert_response :unauthorized
    json = JSON.parse(response.body)
    # Non controlliamo il testo esatto perché dipende dalle traduzioni Devise
    assert json["error"].present?
  end

  test "should logout authenticated customer" do
    post "/api/customers/sign_in", params: {
      customer: { email: @confirmed.email, password: "password" }
    }, as: :json
    assert_response :ok
    auth_header = response.headers["Authorization"]

    delete "/api/customers/sign_out", headers: { Authorization: auth_header }
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Logout effettuato con successo", json["message"]
  end

  # ──────────────────────────────────────────────────────────────
  # Passwords (reset)
  # ──────────────────────────────────────────────────────────────

  test "should send reset password instructions" do
    post "/api/customers/password", params: {
      customer: { email: @confirmed.email }
    }, as: :json
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Email inviata con successo. Controlla la tua casella di posta.", json["message"]

    # Verifica che il token sia stato generato
    token = Customer.find_by(email: @confirmed.email).reset_password_token
    assert_not_nil token, "Il token di reset non è stato generato"
  end

  test "should reset password with valid token" do
    # Genera un token valido manualmente per evitare problemi di timing
    raw_token, hashed_token = Devise.token_generator.generate(Customer, :reset_password_token)
    @confirmed.update!(reset_password_token: hashed_token, reset_password_sent_at: Time.current)

    put "/api/customers/password", params: {
      customer: {
        reset_password_token: raw_token,
        password: "NuovaPassword123!",
        password_confirmation: "NuovaPassword123!"
      }
    }, as: :json
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Password cambiata con successo", json["message"]
  end

  test "should not reset password with invalid token" do
    put "/api/customers/password", params: {
      customer: {
        reset_password_token: "tokeninvalido",
        password: "NuovaPassword123!",
        password_confirmation: "NuovaPassword123!"
      }
    }, as: :json
    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_includes json["error"]["details"].first, "Reset password token"
  end

  # ──────────────────────────────────────────────────────────────
  # Confirmations
  # ──────────────────────────────────────────────────────────────

  test "should resend confirmation instructions" do
    post "/api/customers/confirmation", params: {
      customer: { email: @unconfirmed.email }
    }, as: :json
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Email di conferma inviata con successo", json["message"]
  end

  test "should confirm account with valid token" do
    # Crea un nuovo customer non confermato per avere un token fresco
    post "/api/customers", params: @valid_sign_up_params, as: :json
    assert_response :created
    new_customer = Customer.find_by(email: "nuovo@example.com")
    assert_not new_customer.confirmed?

    token = new_customer.confirmation_token
    get "/api/customers/confirmation", params: { confirmation_token: token }
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Account confermato con successo. Ora puoi effettuare il login.", json["message"]
    assert new_customer.reload.confirmed?
  end

  test "should not confirm with invalid token" do
    get "/api/customers/confirmation", params: { confirmation_token: "tokeninvalido" }
    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert json["errors"].any?
  end
end
