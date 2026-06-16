# test/controllers/members_controller_test.rb
require "test_helper"

class MembersControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @customer = customers(:Customer_Auth)   # Mario Rossi, confermato
    @admin = Admin.create!(
      email: "admin_test@example.com",
      password: "password123!",
      password_confirmation: "password123!"
    )
    @admin.update!(jti: SecureRandom.uuid) if @admin.jti.blank?
  end

  test "should return 401 when no user is authenticated" do
    get "/api/me", as: :json
    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert json["error"].present?
  end

  test "should return customer profile when customer is authenticated" do
    sign_in @customer
    get "/api/me", as: :json
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal @customer.id, json["user"]["id"]
    assert_equal @customer.email, json["user"]["email"]
    assert_equal "Customer", json["user"]["user_type"]
    assert_equal @customer.first_name, json["user"]["first_name"]
    assert_equal @customer.last_name, json["user"]["last_name"]
    assert_equal @customer.confirmed?, json["user"]["confirmed"]
  end

  test "should return admin profile when admin is authenticated" do
    # Effettua il login come admin per ottenere il token JWT
    post "/api/admins/sign_in", params: {
      admin: { email: @admin.email, password: "password123!" }
    }, as: :json
    assert_response :ok
    auth_header = response.headers["Authorization"]

    get "/api/me", headers: { Authorization: auth_header }, as: :json
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal @admin.id, json["user"]["id"]
    assert_equal @admin.email, json["user"]["email"]
    assert_equal "Admin", json["user"]["user_type"]
    assert json["user"]["sign_in_count"] > 0
    end
end