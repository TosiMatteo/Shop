require "test_helper"

# Verifica degli invarianti di unicità del prodotto per carrello e di
# quantità intera ≥ 1.
class CartItemTest < ActiveSupport::TestCase
  def setup
    @cart_item = cart_items(:one)       # carts(:one) + products(:pc)
    @other_cart_item = cart_items(:two) # carts(:two) + products(:book)
  end

  test "the fixture item satisfies the class invariant" do
    assert @cart_item.valid?
  end

  # ─── Quantità intera ≥ 1 ───────────────────────────────────────────────────
  test "is invalid without a quantity" do
    @cart_item.quantity = nil
    assert_not @cart_item.valid?
  end

  test "is invalid with a quantity below one" do
    @cart_item.quantity = 0
    assert_not @cart_item.valid?

    @cart_item.quantity = -3
    assert_not @cart_item.valid?
  end

  test "is invalid with a fractional quantity" do
    @cart_item.quantity = 1.5
    assert_not @cart_item.valid?
  end

  test "accepts a quantity of one" do
    @cart_item.quantity = 1
    assert @cart_item.valid?
  end

  # ─── Unicità del prodotto per carrello ─────────────────────────────────────
  test "rejects the same product twice in the same cart" do
    @other_cart_item.cart = @cart_item.cart
    @other_cart_item.product = @cart_item.product

    assert_not @other_cart_item.valid?
    assert_includes @other_cart_item.errors[:product_id], "già presente nel carrello"
  end

  test "allows the same product in two different carts" do
    @other_cart_item.product = @cart_item.product
    assert @other_cart_item.valid?
  end

  # ─── Associazioni obbligatorie ─────────────────────────────────────────────
  test "requires a cart" do
    @cart_item.cart = nil
    assert_not @cart_item.valid?
  end

  test "requires a product" do
    @cart_item.product = nil
    assert_not @cart_item.valid?
  end

  test "destroying a cart destroys its items" do
    cart = @cart_item.cart

    assert_difference("CartItem.count", -cart.cart_items.count) do
      cart.destroy
    end
  end
end
