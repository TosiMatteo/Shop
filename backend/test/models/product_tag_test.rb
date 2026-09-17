require "test_helper"

# Il modello di join fra Product e Tag. L'unicità della coppia è garantita a
# livello di database (indice unico), non a livello applicativo: il test lo
# documenta esplicitamente.
class ProductTagTest < ActiveSupport::TestCase
  def setup
    @product_tag = product_tags(:pc_informatica)
  end

  test "the fixture association is valid" do
    assert @product_tag.valid?
  end

  test "requires a product" do
    @product_tag.product = nil
    assert_not @product_tag.valid?
  end

  test "requires a tag" do
    @product_tag.tag = nil
    assert_not @product_tag.valid?
  end

  test "accepts a new pair" do
    @product_tag.product = products(:shirt)
    assert @product_tag.valid?
  end

  test "the database rejects a duplicated pair" do
    # Il savepoint isola la violazione del vincolo, così la transazione del test
    # resta utilizzabile dopo l'eccezione.
    assert_raises(ActiveRecord::RecordNotUnique) do
      ProductTag.transaction(requires_new: true) do
        ProductTag.create!(product: @product_tag.product, tag: @product_tag.tag)
      end
    end
  end
end
