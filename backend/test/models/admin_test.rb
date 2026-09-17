require "test_helper"

# Vincoli di integrità sull'entità Amministratore.
# Nota: gli admin non si registrano dalle API pubbliche (routes.rb, skip: [:registrations]),
# quindi qui si verifica solo il modello.
class AdminTest < ActiveSupport::TestCase
  def setup
    @admin = admins(:one)
  end

  test "the fixture admin is valid" do
    assert @admin.valid?
  end

  test "is invalid without an email" do
    @admin.email = nil
    assert_not @admin.valid?
  end

  test "is invalid with a malformed email" do
    @admin.email = "non-una-email"
    assert_not @admin.valid?
  end

  # Serve un secondo admin: la fixture è l'unica esistente.
  test "rejects an email already taken, regardless of case" do
    duplicate = Admin.new(email: "ADMIN1@SHOP.COM", password: "password123")

    assert_not duplicate.valid?
    assert_includes duplicate.errors.attribute_names, :email
  end

  test "downcases the email before validation" do
    @admin.email = "Admin1@Shop.COM"
    @admin.valid?

    assert_equal "admin1@shop.com", @admin.email
  end

  test "rejects a password shorter than six characters" do
    @admin.password = "12345"
    assert_not @admin.valid?
  end

  test "carries the admin role in the jwt payload" do
    assert_equal "Admin", @admin.jwt_payload["user_type"]
  end
end
