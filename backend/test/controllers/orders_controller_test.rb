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
end