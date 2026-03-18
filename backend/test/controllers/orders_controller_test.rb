require "test_helper"

class OrdersControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @customer = customers(:Customer_Auth)
    sign_in @customer
    @order = orders(:one)
    @order.update!(customer: @customer)
  end

  test "should get index with pagy metadata" do
    get orders_url, as: :json
    assert_response :success

    body = response.parsed_body
    assert body.key?("pagy")
    assert body.key?("orders")
  end

  test "should create order" do
    assert_difference("Order.count") do
      post orders_url, params: { order: { customer_id: @order.customer_id, shipping_city: @order.shipping_city, shipping_name: @order.shipping_name, shipping_street: @order.shipping_street, shipping_zip: @order.shipping_zip } }, as: :json
    end

    assert_response :created
  end

  test "should show order" do
    get order_url(@order), as: :json
    assert_response :success
  end

  test "should update order" do
    patch order_url(@order), params: { order: { shipping_city: @order.shipping_city, shipping_name: @order.shipping_name, shipping_street: @order.shipping_street, shipping_zip: @order.shipping_zip, status: @order.status } }, as: :json
    assert_response :success
  end

  test "should update status" do
    patch order_url(@order), params: { order: { status: "completed" } }, as: :json
    assert_response :success
    assert_equal "completed", response.parsed_body["status"]
  end

  test "should destroy order" do
    assert_difference("Order.count", -1) do
      delete order_url(@order), as: :json
    end

    assert_response :no_content
  end

  test "should filter orders by year" do
    @order.update!(created_at: Time.zone.parse("2025-05-20 10:00:00"))
    other_order = Order.create!(
      customer: @customer,
      total: 250.50,
      status: "completed",
      shipping_name: "Luigi",
      shipping_street: "Via Napoli 10",
      shipping_city: "Napoli",
      shipping_zip: "80121",
      created_at: Time.zone.parse("2026-02-10 12:00:00"),
      updated_at: Time.zone.parse("2026-02-10 12:00:00")
    )

    get "/api/orders", params: { year: 2025 }, headers: { "ACCEPT" => "application/json" }
    assert_response :success

    ids = response.parsed_body.fetch("orders", []).map { |o| o["id"] }
    assert_includes ids, @order.id
    assert_not_includes ids, other_order.id
  end
end
