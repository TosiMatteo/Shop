require "test_helper"

# Verifica dei vincoli su quantità e prezzo unitario e della regola di
# snapshot del prezzo.
class OrderItemTest < ActiveSupport::TestCase
  def setup
    @order_item = order_items(:one)
    @order = orders(:one)
    @product = products(:shirt)
  end

  test "the fixture line satisfies the class invariant" do
    assert @order_item.valid?
  end

  # ─── Quantità e prezzo unitario ────────────────────────────────────────────
  test "is invalid with a quantity below one" do
    @order_item.quantity = 0
    assert_not @order_item.valid?
  end

  test "is invalid with a fractional quantity" do
    @order_item.quantity = 2.5
    assert_not @order_item.valid?
  end

  test "is invalid with a negative unit price" do
    @order_item.unit_price = -1
    assert_not @order_item.valid?
  end

  test "accepts a zero unit price" do
    @order_item.unit_price = 0
    assert @order_item.valid?
  end

  # ─── Snapshot del prezzo ───────────────────────────────────────────────────
  # Lo snapshot scatta solo alla creazione: servono righe nuove.
  test "takes the unit price from the product when it is not given" do
    line = OrderItem.create!(order: @order, product: @product, quantity: 1)

    assert_equal @product.price, line.unit_price
  end

  test "keeps an explicitly provided unit price" do
    line = OrderItem.create!(order: @order, product: @product, quantity: 1, unit_price: BigDecimal("3.50"))

    assert_equal BigDecimal("3.50"), line.unit_price
  end

  test "the unit price does not follow later changes of the product price" do
    snapshot = @order_item.unit_price

    @order_item.product.update!(price: BigDecimal("1.00"))

    assert_equal snapshot, @order_item.reload.unit_price
  end

  test "requires an order" do
    @order_item.order = nil
    assert_not @order_item.valid?
  end

  test "requires a product" do
    @order_item.product = nil
    assert_not @order_item.valid?
  end
end
