require "test_helper"

# Verifica dell'invariante INV-O2 e della regola di snapshot del prezzo
# (docs/SPECIFICA.md, OP-2).
class OrderItemTest < ActiveSupport::TestCase
  def setup
    @order = orders(:one)
    @product = products(:shirt)
  end

  test "the fixture line satisfies the class invariant" do
    assert order_items(:one).valid?
  end

  # ─── INV-O2 ────────────────────────────────────────────────────────────────
  test "is invalid with a quantity below one" do
    assert_not OrderItem.new(order: @order, product: @product, quantity: 0, unit_price: 10).valid?
  end

  test "is invalid with a fractional quantity" do
    assert_not OrderItem.new(order: @order, product: @product, quantity: 2.5, unit_price: 10).valid?
  end

  test "is invalid with a negative unit price" do
    assert_not OrderItem.new(order: @order, product: @product, quantity: 1, unit_price: -1).valid?
  end

  test "accepts a zero unit price" do
    assert OrderItem.new(order: @order, product: @product, quantity: 1, unit_price: 0).valid?
  end

  # ─── Snapshot del prezzo ───────────────────────────────────────────────────
  test "takes the unit price from the product when it is not given" do
    line = OrderItem.create!(order: @order, product: @product, quantity: 1)

    assert_equal @product.price, line.unit_price
  end

  test "keeps an explicitly provided unit price" do
    line = OrderItem.create!(order: @order, product: @product, quantity: 1, unit_price: BigDecimal("3.50"))

    assert_equal BigDecimal("3.50"), line.unit_price
  end

  test "the unit price does not follow later changes of the product price" do
    line = OrderItem.create!(order: @order, product: @product, quantity: 1)
    snapshot = line.unit_price

    @product.update!(price: BigDecimal("999.00"))

    assert_equal snapshot, line.reload.unit_price
  end

  test "requires both an order and a product" do
    assert_not OrderItem.new(product: @product, quantity: 1, unit_price: 1).valid?
    assert_not OrderItem.new(order: @order, quantity: 1, unit_price: 1).valid?
  end
end
