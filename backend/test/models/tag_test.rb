require "test_helper"

# Vincoli sull'entità Tag e sulla relazione molti-a-molti con Product
# (docs/SPECIFICA.md, OP-4c).
class TagTest < ActiveSupport::TestCase
  test "the fixture tag is valid" do
    assert tags(:Informatica).valid?
  end

  test "is invalid without a name" do
    assert_not Tag.new.valid?
    assert_not Tag.new(name: "").valid?
  end

  test "rejects a duplicated name" do
    duplicate = Tag.new(name: "Informatica")

    assert_not duplicate.valid?
    assert_includes duplicate.errors.attribute_names, :name
  end

  test "exposes its products through the join model" do
    assert_includes tags(:Informatica).products, products(:pc)
    assert_not_includes tags(:Informatica).products, products(:book)
  end

  # Cancellare un tag scollega i prodotti, non li cancella.
  test "destroying a tag removes the associations but keeps the products" do
    tag = tags(:Informatica)

    assert_difference("ProductTag.count" => -tag.product_tags.count, "Product.count" => 0) do
      tag.destroy
    end

    assert Product.exists?(products(:pc).id)
  end
end
