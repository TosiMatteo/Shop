require "test_helper"

class OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @order = orders(:one)
  end

  test "should get index" do
    get orders_url, as: :json
    assert_response :success
  end

  test "should create order" do
    assert_difference("Order.count") do
      post orders_url, params: { order: { customer_id: @order.customer_id, shipping_city: @order.shipping_city, shipping_name: @order.shipping_name, shipping_street: @order.shipping_street, shipping_zip: @order.shipping_zip, status: @order.status, total: @order.total } }, as: :json
    end

    assert_response :created
  end

  test "should show order" do
    get order_url(@order), as: :json
    assert_response :success
  end

  test "should update order" do
    patch order_url(@order), params: { order: { customer_id: @order.customer_id, shipping_city: @order.shipping_city, shipping_name: @order.shipping_name, shipping_street: @order.shipping_street, shipping_zip: @order.shipping_zip, status: @order.status, total: @order.total } }, as: :json
    assert_response :success
  end

  test "should destroy order" do
    assert_difference("Order.count", -1) do
      delete order_url(@order), as: :json
    end

    assert_response :no_content
  end
end
