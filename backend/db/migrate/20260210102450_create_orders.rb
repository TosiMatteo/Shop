class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :customer, null: false, foreign_key: true
      t.decimal :total, precision: 10, scale: 2
      t.integer :status, default: 0, null: false

      t.string :shipping_street
      t.string :shipping_city
      t.string :shipping_zip

      t.timestamps
    end
  end
end
