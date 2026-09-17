require "test_helper"

class CartsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  SHIPPING = { name: "Mario Rossi", street: "Via Roma 1", city: "Milano", zip: "20100" }.freeze

  setup do
    @customer = customers(:Customer_Auth)
    sign_in @customer
    @cart = carts(:one) # del cliente autenticato, products(:pc) x 1
  end

  # ─── CRUD ──────────────────────────────────────────────────────────────────
  test "should get index" do
    get carts_url, as: :json

    assert_response :ok
  end

  test "should create cart" do
    assert_difference("Cart.count") do
      post carts_url, params: { cart: { customer_id: @customer.id } }, as: :json
    end

    assert_response :created
    assert_equal @customer.id, response.parsed_body["customer_id"]
  end

  test "should show cart" do
    get cart_url(@cart), as: :json

    assert_response :ok
    assert_equal @cart.id, response.parsed_body["id"]
  end

  test "should update cart" do
    patch cart_url(@cart), params: { cart: { customer_id: @customer.id } }, as: :json

    assert_response :ok
  end

  test "should destroy cart" do
    assert_difference("Cart.count", -1) do
      delete cart_url(@cart), as: :json
    end

    assert_response :no_content
  end

  # ─── Checkout ──────────────────────────────────────────────────────────────
  test "should reject checkout of empty cart" do
    @cart.cart_items.destroy_all

    post checkout_cart_url(@cart), params: { shipping: SHIPPING }, as: :json

    assert_response :unprocessable_content
  end

  test "should checkout successfully" do
    cart_items_count = @cart.cart_items.count
    cart_total = @cart.total_price

    assert_difference("Order.count" => 1, "OrderItem.count" => cart_items_count, "Cart.count" => -1) do
      post checkout_cart_url(@cart), params: { shipping: SHIPPING }, as: :json
    end

    assert_response :created
    json = response.parsed_body
    assert_equal cart_total.to_s, json["total"]
    assert_equal "processing", json["status"]
    assert_equal "Mario Rossi", json["shipping_name"]
    assert_equal cart_items_count, json["order_items"]
    assert_not Cart.exists?(@cart.id)
  end
end
