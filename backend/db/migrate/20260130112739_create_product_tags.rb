class CreateProductTags < ActiveRecord::Migration[8.1]
  def change
    create_table :product_tags do |t|
      t.references :product, null: false, foreign_key: true
      t.references :tag, null: false, foreign_key: true
      add_index :product_tags, [ :product_id, :tag_id ], unique: true

      t.timestamps
    end
  end
end
