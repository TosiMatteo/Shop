require "test_helper"

class MembersControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @customer = customers(:Customer_Auth) # confermato
    @admin = admins(:one)
  end

  # ─── Profilo ───────────────────────────────────────────────────────────────
  test "should return 401 when no user is authenticated" do
    get me_url, as: :json

    assert_response :unauthorized
    assert response.parsed_body["error"].present?
  end

  test "should return customer profile when customer is authenticated" do
    sign_in @customer

    get me_url, as: :json

    assert_response :ok
    user = response.parsed_body["user"]
    assert_equal @customer.id, user["id"]
    assert_equal @customer.email, user["email"]
    assert_equal "Customer", user["user_type"]
    assert_equal @customer.first_name, user["first_name"]
    assert_equal @customer.last_name, user["last_name"]
    assert_equal @customer.confirmed?, user["confirmed"]
  end

  test "should return admin profile when admin is authenticated" do
    # Login reale per ottenere il token JWT.
    post admin_session_url, params: { admin: { email: @admin.email, password: "password" } }, as: :json
    assert_response :ok
    auth_header = response.headers["Authorization"]

    get me_url, headers: { Authorization: auth_header }, as: :json

    assert_response :ok
    user = response.parsed_body["user"]
    assert_equal @admin.id, user["id"]
    assert_equal @admin.email, user["email"]
    assert_equal "Admin", user["user_type"]
    assert user["sign_in_count"] > 0
  end
end
