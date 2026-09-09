require "test_helper"

# Verifica dell'invariante INV-O1 e dei contratti OP-4/OP-5 applicati a Order
# (docs/SPECIFICA.md).
class OrderTest < ActiveSupport::TestCase
  def setup
    @customer = customers(:Customer_Auth)
    @order = orders(:one)
  end

  # Crea un ordine valido, sovrascrivibile attributo per attributo.
  def build_order(**overrides)
    Order.new({
      customer: @customer,
      total: 100,
      shipping_name: "Mario Rossi",
      shipping_street: "Via Roma 1",
      shipping_city: "Bologna",
      shipping_zip: "40121"
    }.merge(overrides))
  end

  # ─── INV-O1 ────────────────────────────────────────────────────────────────
  test "the fixture order satisfies the class invariant" do
    assert @order.valid?
  end

  test "is invalid without a customer" do
    assert_not build_order(customer: nil).valid?
  end

  test "is invalid with a negative total" do
    assert_not build_order(total: -1).valid?
  end

  test "accepts a zero total" do
    assert build_order(total: 0).valid?
  end

  test "is invalid without each shipping field" do
    %i[shipping_name shipping_street shipping_city shipping_zip].each do |field|
      assert_not build_order(field => nil).valid?, "#{field} dovrebbe essere obbligatorio"
    end
  end

  test "starts in the processing status" do
    assert_equal "processing", Order.new.status
  end

  test "rejects a status outside the enum" do
    assert_raises(ArgumentError) { build_order(status: "shipped") }
  end

  # ─── OP-4: filtri, verificati in entrambe le direzioni ─────────────────────
  test "search_by_min_max_total keeps only the orders inside the range" do
    inside = build_order(total: 100).tap(&:save!)
    below  = build_order(total: 10).tap(&:save!)
    above  = build_order(total: 1000).tap(&:save!)

    result = @customer.orders.search_by_min_max_total(50, 500)

    assert_includes result, inside
    assert_not_includes result, below
    assert_not_includes result, above
  end

  test "search_by_min_max_total treats each bound as optional" do
    low  = build_order(total: 10).tap(&:save!)
    high = build_order(total: 1000).tap(&:save!)

    only_min = @customer.orders.search_by_min_max_total(50, nil)
    assert_includes only_min, high
    assert_not_includes only_min, low

    only_max = @customer.orders.search_by_min_max_total(nil, 50)
    assert_includes only_max, low
    assert_not_includes only_max, high

    assert_equal @customer.orders.count, @customer.orders.search_by_min_max_total(nil, nil).count
  end

  test "search_by_status keeps only the orders in the given status" do
    completed = build_order(status: :completed).tap(&:save!)

    result = @customer.orders.search_by_status("completed")

    assert_includes result, completed
    assert_not_includes result, @order # fixture: processing
  end

  test "search_by_status without a status is the identity" do
    assert_equal @customer.orders.count, @customer.orders.search_by_status(nil).count
  end

  test "search_by_year keeps only the orders created in the given year" do
    old_order    = build_order.tap { |o| o.save!; o.update_column(:created_at, Time.utc(2020, 6, 1)) }
    recent_order = build_order.tap { |o| o.save!; o.update_column(:created_at, Time.utc(2021, 6, 1)) }

    result = @customer.orders.search_by_year(2020)

    assert_includes result, old_order
    assert_not_includes result, recent_order
  end

  # ─── OP-5: ordinamento ─────────────────────────────────────────────────────
  test "apply_sort orders by total ascending and descending" do
    build_order(total: 5).save!
    build_order(total: 900).save!

    totals = @customer.orders.apply_sort("totalAsc").pluck(:total)
    assert_equal totals.sort, totals

    totals = @customer.orders.apply_sort("totalDesc").pluck(:total)
    assert_equal totals.sort.reverse, totals
  end

  test "apply_sort falls back to the newest first on an unknown key" do
    build_order.tap { |o| o.save!; o.update_column(:created_at, Time.utc(2020, 6, 1)) }

    dates = @customer.orders.apply_sort("qualcosa-di-ignoto").pluck(:created_at)

    assert_equal dates.sort.reverse, dates
  end

  test "apply_sort returns a permutation of the input" do
    build_order(total: 5).save!

    assert_equal @customer.orders.count, @customer.orders.apply_sort("totalAsc").count
  end

  # ─── TR-1 — regressione D-4 ────────────────────────────────────────────────
  # completed e cancelled sono stati finali: nessuna transizione uscente.
  test "allows the transitions leaving processing" do
    %i[completed cancelled].each do |target|
      order = build_order.tap(&:save!)
      assert order.update(status: target), "processing -> #{target} dovrebbe essere ammessa"
    end
  end

  test "rejects every transition leaving a final status" do
    {
      completed: %i[processing cancelled],
      cancelled: %i[processing completed]
    }.each do |from, targets|
      targets.each do |to|
        order = build_order(status: from).tap(&:save!)

        assert_not order.update(status: to), "#{from} -> #{to} non dovrebbe essere ammessa"
        assert_includes order.errors.attribute_names, :status
        assert_equal from.to_s, order.reload.status
      end
    end
  end

  test "saving a final order without touching the status is allowed" do
    order = build_order(status: :cancelled).tap(&:save!)

    assert order.update(shipping_city: "Modena")
  end

  # ─── INV-O3 — regressione D-3 ──────────────────────────────────────────────
  # total(o) = Σ qty(l) × unit_price(l), preservato anche dalle modifiche.
  test "the total follows the lines when they are added, changed or removed" do
    order = build_order(total: 0).tap(&:save!)

    item = OrderItem.create!(order: order, product: products(:pc), quantity: 2, unit_price: 10)
    assert_equal 20, order.reload.total

    item.update!(quantity: 5)
    assert_equal 50, order.reload.total

    OrderItem.create!(order: order, product: products(:book), quantity: 1, unit_price: 7)
    assert_equal 57, order.reload.total

    item.destroy!
    assert_equal 7, order.reload.total
  end

  test "recalculate_total! on an order without lines gives zero" do
    order = build_order(total: 999).tap(&:save!)

    order.recalculate_total!

    assert_equal 0, order.reload.total
  end

  # ─── Cascata ───────────────────────────────────────────────────────────────
  test "destroying an order destroys its lines" do
    assert_difference("OrderItem.count", -@order.order_items.count) do
      @order.destroy
    end
  end
end
