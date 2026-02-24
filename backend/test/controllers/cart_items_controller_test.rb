require "test_helper"

class CartItemsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @cart_item = cart_items(:one)
  end


  test "should create cart_item" do
    assert_difference("CartItem.count") do
      post cart_cart_items_url(carts(:one)), params: { cart_item: { product_id: products(:shirt).id, quantity: 1 } }, as: :json
    end
    assert_response :created
  end

  test "should update cart_item" do
    patch cart_item_url(@cart_item), params: { cart_item: { quantity: 5 } }, as: :json
    assert_response :success
  end

  test "should destroy cart_item" do
    assert_difference("CartItem.count", -1) do
      delete cart_item_url(@cart_item), as: :json
    end

    assert_response :no_content
  end
end
