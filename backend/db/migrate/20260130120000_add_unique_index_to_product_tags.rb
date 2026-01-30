class AddUniqueIndexToProductTags < ActiveRecord::Migration[8.1]
  def change
    add_index :product_tags, [ :product_id, :tag_id ], unique: true
  end
end
