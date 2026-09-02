require "test_helper"

# Vincoli di integrità sull'entità Cliente (docs/SPECIFICA.md, § 4: owner(c), owner(o)).
class CustomerTest < ActiveSupport::TestCase
  def build_customer(**overrides)
    Customer.new({
      first_name: "Anna",
      last_name: "Verdi",
      email: "anna.verdi@example.com",
      password: "password123"
    }.merge(overrides))
  end

  test "the fixture customer is valid" do
    assert customers(:Customer_Auth).valid?
  end

  test "a new customer with complete data is valid" do
    assert build_customer.valid?
  end

  test "is invalid without a first name" do
    assert_not build_customer(first_name: nil).valid?
  end

  test "is invalid without a last name" do
    assert_not build_customer(last_name: nil).valid?
  end

  test "is invalid without an email" do
    assert_not build_customer(email: nil).valid?
  end

  test "is invalid with a malformed email" do
    assert_not build_customer(email: "non-una-email").valid?
  end

  test "rejects an email already taken, regardless of case" do
    duplicate = build_customer(email: "MARIO.ROSSI@EXAMPLE.COM")

    assert_not duplicate.valid?
    assert_includes duplicate.errors.attribute_names, :email
  end

  test "downcases the email before validation" do
    customer = build_customer(email: "Anna.Verdi@Example.COM")
    customer.valid?

    assert_equal "anna.verdi@example.com", customer.email
  end

  test "rejects a password shorter than six characters" do
    assert_not build_customer(password: "12345").valid?
  end

  test "assigns a jti automatically" do
    customer = build_customer
    customer.valid?

    assert_not_nil customer.jti
  end

  # ─── Cascata: un cliente cancellato non lascia carrelli o ordini orfani ────
  test "destroying a customer destroys its cart and its orders" do
    customer = customers(:Customer_Auth)

    assert_difference("Cart.count" => -1, "Order.count" => -customer.orders.count) do
      customer.destroy
    end
  end
end
