require "test_helper"

class CartTest < ActiveSupport::TestCase
  SHIPPING = { name: "Mario Rossi", street: "Via Roma 1", city: "Bologna", zip: "40121" }.freeze

  def setup
    # carts(:one) appartiene a Customer_Auth e contiene una riga: products(:pc) x 1.
    @cart = carts(:one)
  end

  # ─── INV-C3 ────────────────────────────────────────────────────────────────
  test "is invalid without a customer" do
    assert_not Cart.new.valid?
  end

  # ─── OP-1: total_price = Σ qty(i) × price(prod(i)) ─────────────────────────
  test "total_price sums quantity times price over every item" do
    # 999.99 x 1 (pc) + 10.00 x 3 (shirt) = 1029.99
    @cart.cart_items.create!(product: products(:shirt), quantity: 3)

    assert_equal BigDecimal("1029.99"), @cart.total_price
  end

  test "total_price of an empty cart is zero, not nil" do
    empty = Cart.create!(customer: customers(:Customer_NoAuth))

    assert_equal 0, empty.total_price
  end

  test "total_price does not modify the cart" do
    assert_no_difference [ "Cart.count", "CartItem.count" ] do
      @cart.total_price
    end
  end

  # ─── OP-2: checkout, caso nominale ─────────────────────────────────────────
  test "checkout creates one order carrying the cart total and destroys the cart" do
    @cart.cart_items.create!(product: products(:shirt), quantity: 2)
    expected_total = @cart.total_price
    order = nil

    assert_difference("Order.count" => 1, "OrderItem.count" => 2, "Cart.count" => -1, "CartItem.count" => -2) do
      order = @cart.checkout(SHIPPING)
    end

    assert_equal expected_total, order.total
    assert_equal "processing", order.status
    assert_equal customers(:Customer_Auth), order.customer
    assert_equal "Mario Rossi", order.shipping_name
    assert_equal "Via Roma 1", order.shipping_street
    assert_equal "Bologna", order.shipping_city
    assert_equal "40121", order.shipping_zip
  end

  test "checkout copies quantity and current price into every order line" do
    @cart.cart_items.create!(product: products(:shirt), quantity: 2)

    order = @cart.checkout(SHIPPING)

    pc_line = order.order_items.find_by(product: products(:pc))
    assert_equal 1, pc_line.quantity
    assert_equal products(:pc).price, pc_line.unit_price

    shirt_line = order.order_items.find_by(product: products(:shirt))
    assert_equal 2, shirt_line.quantity
    assert_equal products(:shirt).price, shirt_line.unit_price
  end

  # INV-O3: il totale dell'ordine coincide con la somma delle sue righe.
  test "the order total equals the sum of its own lines" do
    @cart.cart_items.create!(product: products(:shirt), quantity: 2)

    order = @cart.checkout(SHIPPING)

    assert_equal order.order_items.sum { |l| l.quantity * l.unit_price }, order.total
  end

  # Immutabilità dello snapshot di prezzo (OP-2).
  test "an order line keeps its price after the product price changes" do
    order = @cart.checkout(SHIPPING)
    line = order.order_items.first
    snapshot = line.unit_price

    line.product.update!(price: BigDecimal("1.00"))

    assert_equal snapshot, line.reload.unit_price
    assert_not_equal line.product.reload.price, line.unit_price
  end

  # ─── OP-2b: carrello vuoto ─────────────────────────────────────────────────
  test "checkout of an empty cart fails and leaves the state untouched" do
    empty = carts(:two)
    empty.cart_items.destroy_all

    assert_no_difference [ "Order.count", "OrderItem.count", "Cart.count" ] do
      assert_raises(ActiveRecord::RecordInvalid) { empty.checkout(SHIPPING) }
    end

    assert Cart.exists?(empty.id), "il carrello non deve essere distrutto se il checkout fallisce"
  end

  # ─── OP-2c: spedizione incompleta, atomicità della transazione ─────────────
  test "checkout without a shipping name rolls back completely" do
    incomplete = SHIPPING.except(:name)

    assert_no_difference [ "Order.count", "OrderItem.count", "Cart.count", "CartItem.count" ] do
      assert_raises(ActiveRecord::RecordInvalid) { @cart.checkout(incomplete) }
    end

    assert Cart.exists?(@cart.id)
  end
end
