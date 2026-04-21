class ProductTag < ApplicationRecord
  # Join model between products and tags.
  belongs_to :product
  belongs_to :tag
end
