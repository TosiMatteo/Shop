require "test_helper"

class ProductsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @admin = admins(:one)
    sign_in @admin
    @product = products(:pc) # tag Informatica
    @product_params = {
      product: {
        title: @product.title,
        description: @product.description,
        original_price: @product.original_price,
        price: @product.price,
        sale: @product.sale,
        tag_ids: @product.tags.ids
      }
    }
  end

  # ─── Lettura ───────────────────────────────────────────────────────────────
  test "should get index" do
    get products_url, as: :json

    assert_response :ok
  end

  test "should filter products by tag" do
    get products_url, params: { tag: "Informatica" }

    assert_response :ok
    ids = response.parsed_body["products"].map { |p| p["id"] }
    assert_includes ids, @product.id
  end

  test "should show product" do
    get product_url(@product), as: :json

    assert_response :ok
    assert_equal @product.id, response.parsed_body["id"]
  end

  # ─── Scrittura (admin) ─────────────────────────────────────────────────────
  test "should create product" do
    params = { product: @product_params[:product].merge(
      title: "Nuovo prodotto", original_price: 200, price: 200, sale: false, discount_percentage: 10
    ) }

    assert_difference("Product.count") do
      post products_url, params: params, as: :json
    end

    assert_response :created
    created = Product.find(response.parsed_body["id"])
    assert_equal (200 * 0.9).round(2), created.price
    assert created.sale
  end

  test "should not create product with invalid params" do
    params = { product: @product_params[:product].merge(title: nil) }

    assert_no_difference("Product.count") do
      post products_url, params: params, as: :json
    end

    assert_response :unprocessable_content
  end

  test "should update product" do
    params = { product: @product_params[:product].merge(
      original_price: 300, price: 300, sale: false, discount_percentage: 20
    ) }

    patch product_url(@product), params: params, as: :json

    assert_response :ok
    @product.reload
    assert_equal (300 * 0.8).round(2), @product.price
    assert @product.sale
  end

  test "should not update product with invalid params" do
    patch product_url(@product), params: { product: { title: "" } }, as: :json

    assert_response :unprocessable_content
  end

  test "should destroy product" do
    assert_difference("Product.count", -1) do
      delete product_url(@product), as: :json
    end

    assert_response :no_content
  end
end
