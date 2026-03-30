require "test_helper"

class CartsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers
  setup do
    @customer = customers(:Customer_Auth)
    sign_in @customer

    @cart = carts(:one)
    @cart.update!(customer: @customer)
  end

  test "should get index" do
    get carts_url, as: :json
    assert_response :success
  end

  test "should create cart" do
    assert_difference("Cart.count") do
      post carts_url, params: { cart: { customer_id: @cart.customer_id } }, as: :json
    end

    assert_response :created
  end

  test "should show cart" do
    get cart_url(@cart), as: :json
    assert_response :success
  end

  test "should update cart" do
    patch cart_url(@cart), params: { cart: { customer_id: @cart.customer_id } }, as: :json
    assert_response :success
  end

  test "should destroy cart" do
    assert_difference("Cart.count", -1) do
      delete cart_url(@cart), as: :json
    end

    assert_response :no_content
  end

  test "should reject checkout of empty cart" do
    @cart.cart_items.destroy_all

    post checkout_cart_url(@cart), params: {
      shipping: {
        name: "Mario Rossi",
        street: "Via Roma 1",
        city: "Milano",
        zip: "20100"
      }
    }, as: :json

    assert_response :unprocessable_content
  end

  test "should checkout successfully" do
    assert @cart.cart_items.any?, "Cart should have items"

    cart_items_count = @cart.cart_items.count
    cart_total = @cart.total_price

    assert_difference("Order.count", 1) do
      assert_difference("OrderItem.count", cart_items_count) do
        assert_difference("Cart.count", -1) do
          post checkout_cart_url(@cart), params: {
            shipping: {
              name: "Mario Rossi",
              street: "Via Roma 1",
              city: "Milano",
              zip: "20100"
            }
          }, as: :json
        end
      end
    end

    assert_response :created

    json_response = JSON.parse(response.body)
    assert_equal cart_total.to_s, json_response["total"]
    assert_equal "processing", json_response["status"]
    assert_equal "Mario Rossi", json_response["shipping_name"]
    assert_equal cart_items_count, json_response["order_items"]

    assert_not Cart.exists?(@cart.id)
  end
end
