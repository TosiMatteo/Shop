require "test_helper"

class CustomersControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @customer = customers(:Customer_Auth)               # confermato
    @unconfirmed_customer = customers(:Customer_NoAuth) # non confermato
    @valid_sign_up_params = {
      customer: {
        email: "nuovo@example.com",
        password: "Password123!",
        password_confirmation: "Password123!",
        first_name: "Nuovo",
        last_name: "Utente"
      }
    }
    @invalid_sign_up_params = {
      customer: {
        email: "non-valida",
        password: "short",
        password_confirmation: "short",
        first_name: "",
        last_name: ""
      }
    }
  end

  # ─── Registrations ─────────────────────────────────────────────────────────
  test "should register a new customer (pending confirmation)" do
    assert_difference("Customer.count", 1) do
      post customer_registration_url, params: @valid_sign_up_params, as: :json
    end

    assert_response :created
    json = response.parsed_body
    # Con Devise :confirmable, il nuovo utente non è attivo subito.
    assert_equal "Registrazione completata. Controlla la tua email per confermare l'account.", json["message"]
    assert_equal "nuovo@example.com", json["user"]["email"]
    assert_equal "Customer", json["user"]["user_type"]
  end

  test "should not register with invalid data" do
    assert_no_difference("Customer.count") do
      post customer_registration_url, params: @invalid_sign_up_params, as: :json
    end

    assert_response :unprocessable_content
    assert_equal "Validation failed", response.parsed_body["error"]["message"]
  end

  test "should not allow duplicate email" do
    params = { customer: @valid_sign_up_params[:customer].merge(email: @customer.email) }

    assert_no_difference("Customer.count") do
      post customer_registration_url, params: params, as: :json
    end

    assert_response :unprocessable_content
    json = response.parsed_body
    assert_equal "Validation failed", json["error"]["message"]
    assert_includes json["error"]["details"].first, "Email"
  end

  # ─── Sessions ──────────────────────────────────────────────────────────────
  test "should login with valid confirmed customer" do
    post customer_session_url, params: { customer: { email: @customer.email, password: "password" } }, as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal "Login effettuato con successo", json["message"]
    assert_equal @customer.email, json["user"]["email"]
  end

  test "should not login with wrong password" do
    post customer_session_url, params: { customer: { email: @customer.email, password: "sbagliata" } }, as: :json

    assert_response :unauthorized
    assert response.parsed_body["error"].present?
  end

  test "should not login with unconfirmed account" do
    post customer_session_url, params: {
      customer: { email: @unconfirmed_customer.email, password: "password" }
    }, as: :json

    assert_response :unauthorized
    # Il testo esatto dipende dalle traduzioni Devise.
    assert response.parsed_body["error"].present?
  end

  test "should logout authenticated customer" do
    post customer_session_url, params: { customer: { email: @customer.email, password: "password" } }, as: :json
    assert_response :ok
    auth_header = response.headers["Authorization"]

    delete destroy_customer_session_url, headers: { Authorization: auth_header }, as: :json

    assert_response :ok
    assert_equal "Logout effettuato con successo", response.parsed_body["message"]
  end

  # ─── Passwords ─────────────────────────────────────────────────────────────
  test "should send reset password instructions" do
    post customer_password_url, params: { customer: { email: @customer.email } }, as: :json

    assert_response :ok
    assert_equal "Email inviata con successo. Controlla la tua casella di posta.", response.parsed_body["message"]
    assert_not_nil @customer.reload.reset_password_token, "Il token di reset non è stato generato"
  end

  test "should reset password with valid token" do
    # Token generato a mano per non dipendere dall'email inviata.
    raw_token, hashed_token = Devise.token_generator.generate(Customer, :reset_password_token)
    @customer.update!(reset_password_token: hashed_token, reset_password_sent_at: Time.current)

    put customer_password_url, params: {
      customer: {
        reset_password_token: raw_token,
        password: "NuovaPassword123!",
        password_confirmation: "NuovaPassword123!"
      }
    }, as: :json

    assert_response :ok
    assert_equal "Password cambiata con successo", response.parsed_body["message"]
  end

  test "should not reset password with invalid token" do
    put customer_password_url, params: {
      customer: {
        reset_password_token: "tokeninvalido",
        password: "NuovaPassword123!",
        password_confirmation: "NuovaPassword123!"
      }
    }, as: :json

    assert_response :unprocessable_content
    assert_includes response.parsed_body["error"]["details"].first, "Reset password token"
  end

  # ─── Confirmations ─────────────────────────────────────────────────────────
  test "should resend confirmation instructions" do
    post customer_confirmation_url, params: { customer: { email: @unconfirmed_customer.email } }, as: :json

    assert_response :ok
    assert_equal "Email di conferma inviata con successo", response.parsed_body["message"]
  end

  test "should confirm account with valid token" do
    # Registrazione reale per avere un token di conferma fresco.
    post customer_registration_url, params: @valid_sign_up_params, as: :json
    assert_response :created
    new_customer = Customer.find_by(email: "nuovo@example.com")
    assert_not new_customer.confirmed?

    get customer_confirmation_url, params: { confirmation_token: new_customer.confirmation_token }

    assert_response :ok
    assert_equal "Account confermato con successo. Ora puoi effettuare il login.", response.parsed_body["message"]
    assert new_customer.reload.confirmed?
  end

  test "should not confirm with invalid token" do
    get customer_confirmation_url, params: { confirmation_token: "tokeninvalido" }

    assert_response :unprocessable_content
    # Questo endpoint restituisce { errors: [...] }, non il formato di ErrorHandler.
    assert response.parsed_body["errors"].any?
  end
end
