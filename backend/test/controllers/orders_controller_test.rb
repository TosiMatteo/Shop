require "test_helper"

class OrdersControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @customer = customers(:Customer_Auth)
    sign_in @customer
    @order = orders(:one) # del cliente autenticato, processing
    @order_params = {
      order: {
        shipping_name: @order.shipping_name,
        shipping_street: @order.shipping_street,
        shipping_city: @order.shipping_city,
        shipping_zip: @order.shipping_zip
      }
    }
  end

  # ─── CRUD ──────────────────────────────────────────────────────────────────
  test "should get index with pagy metadata" do
    get orders_url, as: :json

    assert_response :ok
    json = response.parsed_body
    assert json.key?("pagy")
    assert json.key?("orders")
  end

  test "should create order" do
    assert_difference("Order.count") do
      post orders_url, params: @order_params, as: :json
    end

    assert_response :created
  end

  # L'ordine appartiene al cliente autenticato anche se la richiesta prova a
  # intestarlo a un altro: customer_id non è fra i parametri accettati.
  test "should ignore the customer_id sent in the request" do
    other = customers(:Customer_NoAuth)
    params = { order: @order_params[:order].merge(customer_id: other.id) }

    assert_no_difference("other.orders.count") do
      post orders_url, params: params, as: :json
    end

    assert_response :created
    created = Order.find(response.parsed_body["id"])
    assert_equal @customer, created.customer
  end

  test "should show order" do
    get order_url(@order), as: :json

    assert_response :ok
    assert_equal @order.id, response.parsed_body["id"]
  end

  test "should update order" do
    params = { order: @order_params[:order].merge(shipping_city: "Modena") }

    patch order_url(@order), params: params, as: :json

    assert_response :ok
    assert_equal "Modena", @order.reload.shipping_city
  end

  test "should destroy order" do
    assert_difference("Order.count", -1) do
      delete order_url(@order), as: :json
    end

    assert_response :no_content
  end

  # ─── Stato ─────────────────────────────────────────────────────────────────
  test "should update status" do
    patch order_url(@order), params: { order: { status: "completed" } }, as: :json

    assert_response :ok
    assert_equal "completed", response.parsed_body["status"]
  end

  test "should reject a status transition leaving a final status" do
    @order.update!(status: :cancelled)

    patch order_url(@order), params: { order: { status: "completed" } }, as: :json

    assert_response :unprocessable_content
    assert_equal "cancelled", @order.reload.status
  end

  # ─── Filtri ────────────────────────────────────────────────────────────────
  test "should filter orders by year" do
    @order.update!(created_at: Time.zone.parse("2025-05-20 10:00:00"))
    other_order = @customer.orders.create!(
      @order_params[:order].merge(created_at: Time.zone.parse("2026-02-10 12:00:00"))
    )

    get orders_url, params: { year: 2025, sort: "dateAsc" }

    assert_response :ok
    ids = response.parsed_body.fetch("orders", []).map { |o| o["id"] }
    assert_includes ids, @order.id
    assert_not_includes ids, other_order.id
  end
end
