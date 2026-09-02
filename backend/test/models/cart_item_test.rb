require "test_helper"

# Verifica degli invarianti INV-C1 (unicità del prodotto per carrello) e
# INV-C2 (quantità intera ≥ 1) definiti in docs/SPECIFICA.md.
class CartItemTest < ActiveSupport::TestCase
  def setup
    @cart = carts(:one)      # contiene già products(:pc)
    @other_cart = carts(:two)
  end

  test "the fixture item satisfies the class invariant" do
    assert cart_items(:one).valid?
  end

  # ─── INV-C2 ────────────────────────────────────────────────────────────────
  test "is invalid without a quantity" do
    assert_not CartItem.new(cart: @cart, product: products(:shirt)).valid?
  end

  test "is invalid with a quantity below one" do
    assert_not CartItem.new(cart: @cart, product: products(:shirt), quantity: 0).valid?
    assert_not CartItem.new(cart: @cart, product: products(:shirt), quantity: -3).valid?
  end

  test "is invalid with a fractional quantity" do
    assert_not CartItem.new(cart: @cart, product: products(:shirt), quantity: 1.5).valid?
  end

  test "accepts a quantity of one" do
    assert CartItem.new(cart: @cart, product: products(:shirt), quantity: 1).valid?
  end

  # ─── INV-C1 ────────────────────────────────────────────────────────────────
  test "rejects the same product twice in the same cart" do
    duplicate = CartItem.new(cart: @cart, product: products(:pc), quantity: 1)

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:product_id], "già presente nel carrello"
  end

  test "allows the same product in two different carts" do
    assert CartItem.new(cart: @other_cart, product: products(:pc), quantity: 1).valid?
  end

  # ─── Associazioni obbligatorie ─────────────────────────────────────────────
  test "requires both a cart and a product" do
    assert_not CartItem.new(product: products(:shirt), quantity: 1).valid?
    assert_not CartItem.new(cart: @cart, quantity: 1).valid?
  end

  test "destroying a cart destroys its items" do
    assert_difference("CartItem.count", -@cart.cart_items.count) do
      @cart.destroy
    end
  end
end
