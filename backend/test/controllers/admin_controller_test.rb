require "test_helper"

class AdminsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @admin = Admin.create!(
      email: "admin_test@example.com",
      password: "password123!",
      password_confirmation: "password123!"
    )
    # Assicura che il jti sia presente (richiesto da devise-jwt per la revoca)
    @admin.update!(jti: SecureRandom.uuid) if @admin.jti.blank?

    @valid_login_params = {
      admin: {
        email: @admin.email,
        password: "password123!"
      }
    }
    @invalid_login_params = {
      admin: {
        email: @admin.email,
        password: "sbagliata"
      }
    }
  end

  # ─── Sessions ─────────────────────────────────────────────────────────

  test "should login admin with valid credentials" do
    post "/api/admins/sign_in", params: @valid_login_params, as: :json
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Login admin effettuato con successo", json["message"]
    assert_equal @admin.email, json["user"]["email"]
    assert_equal "Admin", json["user"]["user_type"]
    assert_not_nil response.headers["Authorization"]
  end

  test "should not login admin with wrong password" do
    post "/api/admins/sign_in", params: @invalid_login_params, as: :json
    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert json["error"].present?
  end

  test "should handle logout without authentication gracefully" do
    delete "/api/admins/sign_out"
    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert_equal "Utente non autenticato", json["error"]
  end

  # ─── Passwords ────────────────────────────────────────────────────────

  test "should send reset password instructions" do
    post "/api/admins/password", params: {
      admin: { email: @admin.email }
    }, as: :json
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal "Email inviata con successo", json["message"]

    token = Admin.find_by(email: @admin.email).reset_password_token
    assert_not_nil token, "Il token di reset non è stato generato"
  end

  test "should reset password with valid token" do
    raw_token, hashed_token = Devise.token_generator.generate(Admin, :reset_password_token)
    @admin.update!(reset_password_token: hashed_token, reset_password_sent_at: Time.current)

    put "/api/admins/password", params: {
      admin: {
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
    put "/api/admins/password", params: {
      admin: {
        reset_password_token: "tokeninvalido",
        password: "NuovaPassword123!",
        password_confirmation: "NuovaPassword123!"
      }
    }, as: :json
    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_includes json["error"]["details"].first, "Reset password token"
  end
end