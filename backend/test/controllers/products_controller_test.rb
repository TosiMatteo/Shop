require "test_helper"

class ProductsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers
  setup do
    @admin = admins(:one)
    sign_in @admin
    @product = products(:pc)
  end

  test "should get index" do
    get products_url, as: :json
    assert_response :success
  end

  test "should filter products by tag" do
    get products_url, params: { tag: "Informatica" }
    assert_response :success

    body = response.parsed_body
    products = body["products"]
    ids = products.map { |product| product["id"] }
    assert_includes ids, products(:pc).id
  end

  test "should create product" do
    title = "Created product #{Time.current.to_i}"

    assert_difference("Product.count") do
      post products_url, params: {
        product: {
          title: title,
          description: @product.description,
          original_price: 200,
          price: 200,
          sale: false,
          discount_percentage: 10,
          tag_ids: @product.tags.ids
        }
      }, as: :json
    end

    assert_response :created
    created = Product.find(response.parsed_body["id"])
    assert_equal (200 * 0.9).round(2), created.price
    assert created.sale
  end

  test "should not create product with invalid params" do
    assert_no_difference("Product.count") do
      post products_url, params: { product: { description: @product.description, original_price: @product.original_price, sale: @product.sale, tag_ids: @product.tags.ids, title: nil } }, as: :json
    end

    assert_response :unprocessable_content
  end

  test "should show product" do
    get product_url(@product), as: :json
    assert_response :success
  end

  test "should update product" do
    patch product_url(@product), params: {
      product: {
        title: @product.title,
        description: @product.description,
        original_price: 300,
        price: 300,
        sale: false,
        discount_percentage: 20,
        tag_ids: @product.tags.ids
      }
    }, as: :json
    assert_response :success
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
