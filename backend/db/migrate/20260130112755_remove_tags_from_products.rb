class RemoveTagsFromProducts < ActiveRecord::Migration[8.1]
  def change
    remove_column :products, :tags, :json
  end
end
