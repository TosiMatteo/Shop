require "test_helper"

class AdminsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @admin = admins(:one)
    @valid_login_params = { admin: { email: @admin.email, password: "password" } }
    @invalid_login_params = { admin: { email: @admin.email, password: "sbagliata" } }
  end

  # ─── Sessions ─────────────────────────────────────────────────────────

  test "should login admin with valid credentials" do
    post admin_session_url, params: @valid_login_params, as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal "Login admin effettuato con successo", json["message"]
    assert_equal @admin.email, json["user"]["email"]
    assert_equal "Admin", json["user"]["user_type"]
    assert_not_nil response.headers["Authorization"]
  end

  test "should not login admin with wrong password" do
    post admin_session_url, params: @invalid_login_params, as: :json

    assert_response :unauthorized
    assert_match(/password non validi/, response.parsed_body["error"])
  end

  test "should handle logout without authentication gracefully" do
    delete destroy_admin_session_url, as: :json

    assert_response :unauthorized
    assert_equal "Utente non autenticato", response.parsed_body["error"]
  end

  # ─── Passwords ─────────────────────────────────────────────────────────────
  test "should send reset password instructions" do
    post admin_password_url, params: { admin: { email: @admin.email } }, as: :json

    assert_response :ok
    assert_equal "Email inviata con successo", response.parsed_body["message"]
    assert_not_nil @admin.reload.reset_password_token, "Il token di reset non è stato generato"
  end

  test "should reset password with valid token" do
    raw_token, hashed_token = Devise.token_generator.generate(Admin, :reset_password_token)
    @admin.update!(reset_password_token: hashed_token, reset_password_sent_at: Time.current)

    put admin_password_url, params: {
      admin: {
        reset_password_token: raw_token,
        password: "NuovaPassword123!",
        password_confirmation: "NuovaPassword123!"
      }
    }, as: :json

    assert_response :ok
    assert_equal "Password cambiata con successo", response.parsed_body["message"]
  end

  test "should not reset password with invalid token" do
    put admin_password_url, params: {
      admin: {
        reset_password_token: "tokeninvalido",
        password: "NuovaPassword123!",
        password_confirmation: "NuovaPassword123!"
      }
    }, as: :json

    assert_response :unprocessable_content
    assert_includes response.parsed_body["error"]["details"].first, "Reset password token"
  end
end
