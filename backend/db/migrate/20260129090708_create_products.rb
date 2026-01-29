class CreateProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.string :title
      t.text :description
      t.decimal :price, precision: 10, scale: 2
      t.decimal :original_price, precision: 10, scale: 2
      t.boolean :sale
      t.json :tags

      t.timestamps
    end
  end
end
