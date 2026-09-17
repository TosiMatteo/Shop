require "test_helper"

# Verifica dell'invariante di classe e dei contratti di filtro e ordinamento
# applicati a Order.
class OrderTest < ActiveSupport::TestCase
  def setup
    @customer = customers(:Customer_Auth)
    @order = orders(:one)            # Customer_Auth, processing
    @completed_order = orders(:two)  # Customer_NoAuth, completed
  end

  # Crea un ordine nuovo, per i test che ne richiedono più di quelli in fixture.
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

  # ─── Validità dell'ordine ──────────────────────────────────────────────────
  test "the fixture order satisfies the class invariant" do
    assert @order.valid?
  end

  test "is invalid without a customer" do
    @order.customer = nil
    assert_not @order.valid?
  end

  test "is invalid with a negative total" do
    @order.total = -1
    assert_not @order.valid?
  end

  test "accepts a zero total" do
    @order.total = 0
    assert @order.valid?
  end

  test "is invalid without each shipping field" do
    %i[shipping_name shipping_street shipping_city shipping_zip].each do |field|
      @order.reload
      @order[field] = nil
      assert_not @order.valid?, "#{field} dovrebbe essere obbligatorio"
    end
  end

  test "starts in the processing status" do
    assert_equal "processing", Order.new.status
  end

  test "rejects a status outside the enum" do
    assert_raises(ArgumentError) { @order.status = "shipped" }
  end

  # ─── Filtri, verificati in entrambe le direzioni ───────────────────────────
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
    result = Order.search_by_status("completed")

    assert_includes result, @completed_order
    assert_not_includes result, @order
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

  # ─── Ordinamento ───────────────────────────────────────────────────────────
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

  # ─── Transizioni di stato (regressione) ────────────────────────────────────
  # completed e cancelled sono stati finali: nessuna transizione uscente.
  test "allows the transitions leaving processing" do
    %i[completed cancelled].each do |target|
      @order.update_column(:status, :processing)
      assert @order.update(status: target), "processing -> #{target} dovrebbe essere ammessa"
    end
  end

  test "rejects every transition leaving a final status" do
    {
      completed: %i[processing cancelled],
      cancelled: %i[processing completed]
    }.each do |from, targets|
      targets.each do |to|
        @order.update_column(:status, from)

        assert_not @order.update(status: to), "#{from} -> #{to} non dovrebbe essere ammessa"
        assert_includes @order.errors.attribute_names, :status
        assert_equal from.to_s, @order.reload.status
      end
    end
  end

  test "saving a final order without touching the status is allowed" do
    assert @completed_order.update(shipping_city: "Modena")
  end

  # ─── Totale dell'ordine (regressione) ──────────────────────────────────────
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
