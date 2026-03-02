class AddShippingNameToOrder < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :shipping_name, :string
  end
end
