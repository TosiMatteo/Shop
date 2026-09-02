require "test_helper"

# Vincoli di integrità sull'entità Amministratore.
# Nota: gli admin non si registrano dalle API pubbliche (routes.rb, skip: [:registrations]),
# quindi qui si verifica solo il modello.
class AdminTest < ActiveSupport::TestCase
  def build_admin(**overrides)
    Admin.new({ email: "nuovo.admin@shop.com", password: "password123" }.merge(overrides))
  end

  test "a new admin with complete credentials is valid" do
    assert build_admin.valid?
  end

  test "is invalid without an email" do
    assert_not build_admin(email: nil).valid?
  end

  test "is invalid with a malformed email" do
    assert_not build_admin(email: "non-una-email").valid?
  end

  test "rejects an email already taken, regardless of case" do
    duplicate = build_admin(email: "ADMIN1@SHOP.COM")

    assert_not duplicate.valid?
    assert_includes duplicate.errors.attribute_names, :email
  end

  test "downcases the email before validation" do
    admin = build_admin(email: "Nuovo.Admin@Shop.COM")
    admin.valid?

    assert_equal "nuovo.admin@shop.com", admin.email
  end

  test "rejects a password shorter than six characters" do
    assert_not build_admin(password: "12345").valid?
  end

  test "carries the admin role in the jwt payload" do
    assert_equal "Admin", build_admin.jwt_payload["user_type"]
  end
end
