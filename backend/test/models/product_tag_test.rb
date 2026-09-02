require "test_helper"

# Il modello di join fra Product e Tag. L'unicità della coppia è garantita a
# livello di database (indice unico), non a livello applicativo: il test lo
# documenta esplicitamente.
class ProductTagTest < ActiveSupport::TestCase
  test "the fixture association is valid" do
    assert product_tags(:pc_informatica).valid?
  end

  test "requires both a product and a tag" do
    assert_not ProductTag.new(product: products(:pc)).valid?
    assert_not ProductTag.new(tag: tags(:Informatica)).valid?
  end

  test "accepts a new pair" do
    assert ProductTag.new(product: products(:shirt), tag: tags(:Informatica)).valid?
  end

  test "the database rejects a duplicated pair" do
    # Il savepoint isola la violazione del vincolo, così la transazione del test
    # resta utilizzabile dopo l'eccezione.
    assert_raises(ActiveRecord::RecordNotUnique) do
      ProductTag.transaction(requires_new: true) do
        ProductTag.create!(product: products(:pc), tag: tags(:Informatica))
      end
    end
  end
end
