require "test_helper"

class ProductTest < ActiveSupport::TestCase
  def setup
    @product = products(:pc)
  end

  test "should be valid" do
    assert @product.valid?
  end

  test "should not be valid without a title" do
    @product.title = nil
    assert_not @product.valid?
  end

  test "should not be valid without a price" do
    @product.price = nil
    assert_not @product.valid?
  end

  test "should not be valid without a description" do
    @product.description = nil
    assert_not @product.valid?
  end

  test "search_by_title should return products with matching title" do
    assert_equal Product.search_by_title("Notebook"), [@product]
    assert_equal Product.search_by_title("mac"), []
  end

  test "search_by_tag should return products with matching tag" do
    assert_equal Product.search_by_tag("Informatica"), [@product]
    assert_equal Product.search_by_tag("Smartphone"), []
  end

  test "search_by_sale should return products with matching sale" do
    assert_includes Product.search_by_sale(false), @product
    assert_not_includes Product.search_by_sale(true), @product
  end

  test "search_by_min_max_price should return products with matching price range" do
    assert_equal Product.search_by_min_max_price(900, 1100), [@product]
    assert_equal Product.search_by_min_max_price(100, 200), []
  end

end
