require "test_helper"

# Vincoli sull'entità Tag e sulla relazione molti-a-molti con Product.
class TagTest < ActiveSupport::TestCase
  def setup
    @tag = tags(:Informatica)
    @other_tag = tags(:Tazze)
  end

  test "the fixture tag is valid" do
    assert @tag.valid?
  end

  test "is invalid without a name" do
    @tag.name = nil
    assert_not @tag.valid?

    @tag.name = ""
    assert_not @tag.valid?
  end

  test "rejects a duplicated name" do
    @other_tag.name = @tag.name

    assert_not @other_tag.valid?
    assert_includes @other_tag.errors.attribute_names, :name
  end

  test "exposes its products through the join model" do
    assert_includes @tag.products, products(:pc)
    assert_not_includes @tag.products, products(:book)
  end

  # Cancellare un tag scollega i prodotti, non li cancella.
  test "destroying a tag removes the associations but keeps the products" do
    assert_difference("ProductTag.count" => -@tag.product_tags.count, "Product.count" => 0) do
      @tag.destroy
    end

    assert Product.exists?(products(:pc).id)
  end
end
