require "test_helper"

class CartItemsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @customer = customers(:Customer_Auth)
    sign_in @customer
    @cart = carts(:one)           # del cliente autenticato
    @cart_item = cart_items(:one) # products(:pc) x 1
  end

  # ─── CRUD ──────────────────────────────────────────────────────────────────
  test "should create cart_item" do
    assert_difference("CartItem.count") do
      post cart_cart_items_url(@cart), params: {
        cart_item: { product_id: products(:shirt).id, quantity: 1 }
      }, as: :json
    end

    assert_response :created
    assert_equal products(:shirt).id, response.parsed_body["product_id"]
  end

  test "should update cart_item" do
    patch cart_item_url(@cart_item), params: { cart_item: { quantity: 5 } }, as: :json

    assert_response :ok
    assert_equal 5, @cart_item.reload.quantity
  end

  test "should destroy cart_item" do
    assert_difference("CartItem.count", -1) do
      delete cart_item_url(@cart_item), as: :json
    end

    assert_response :no_content
  end
end
