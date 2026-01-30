require "test_helper"

class ProductsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @product = products(:one)
  end

  test "should get index" do
    get products_url, as: :json
    assert_response :success
  end

  test "should filter products by tag" do
    get products_url, params: { tag: "Informatica" }
    assert_response :success

    body = response.parsed_body
    ids = body.map { |product| product["id"] }
    assert_includes ids, products(:one).id
    refute_includes ids, products(:two).id
  end

  test "should create product" do
    assert_difference("Product.count") do
      post products_url, params: { product: { description: @product.description, original_price: @product.original_price, price: @product.price, sale: @product.sale, tags: @product.tags, title: @product.title } }, as: :json
    end

    assert_response :created
  end

  test "should not create product with invalid params" do
    assert_no_difference("Product.count") do
      post products_url, params: { product: { description: @product.description, original_price: @product.original_price, sale: @product.sale, tags: @product.tags, title: nil } }, as: :json
    end

    assert_response :unprocessable_content
  end

  test "should show product" do
    get product_url(@product), as: :json
    assert_response :success
  end

  test "should update product" do
    patch product_url(@product), params: { product: { description: @product.description, original_price: @product.original_price, price: @product.price, sale: @product.sale, tags: @product.tags, title: @product.title } }, as: :json
    assert_response :success
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
