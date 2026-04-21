class Tag < ApplicationRecord
  # Many-to-many relationship with products.
  has_many :product_tags, dependent: :destroy
  has_many :products, through: :product_tags

  # Tag names must be present and unique.
  validates :name, presence: true, uniqueness: true
end
