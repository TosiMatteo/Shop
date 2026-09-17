require "test_helper"

# Vincoli di integrità sull'entità Cliente e sulla proprietà di carrelli e ordini.
class CustomerTest < ActiveSupport::TestCase
  def setup
    @customer = customers(:Customer_Auth)
    @other_customer = customers(:Customer_NoAuth)
  end

  test "the fixture customer is valid" do
    assert @customer.valid?
  end

  test "is invalid without a first name" do
    @customer.first_name = nil
    assert_not @customer.valid?
  end

  test "is invalid without a last name" do
    @customer.last_name = nil
    assert_not @customer.valid?
  end

  test "is invalid without an email" do
    @customer.email = nil
    assert_not @customer.valid?
  end

  test "is invalid with a malformed email" do
    @customer.email = "non-una-email"
    assert_not @customer.valid?
  end

  test "rejects an email already taken, regardless of case" do
    @customer.email = @other_customer.email.upcase

    assert_not @customer.valid?
    assert_includes @customer.errors.attribute_names, :email
  end

  test "downcases the email before validation" do
    @customer.email = "Mario.Rossi@Example.COM"
    @customer.valid?

    assert_equal "mario.rossi@example.com", @customer.email
  end

  test "rejects a password shorter than six characters" do
    @customer.password = "12345"
    assert_not @customer.valid?
  end

  test "assigns a jti automatically" do
    @customer.jti = nil
    @customer.valid?

    assert_not_nil @customer.jti
  end

  # ─── Cascata: un cliente cancellato non lascia carrelli o ordini orfani ────
  test "destroying a customer destroys its cart and its orders" do
    assert_difference("Cart.count" => -1, "Order.count" => -@customer.orders.count) do
      @customer.destroy
    end
  end
end
