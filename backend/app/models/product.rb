class Product < ApplicationRecord
  has_many :product_tags, dependent: :destroy
  has_many :tags, through: :product_tags

  has_one_attached :thumbnail
  validates :title, presence: true, length: { minimum: 2, maximum: 50 }
  validates :description, presence: true, length: { minimum: 5, maximum: 1000 }
  validates :original_price, presence: true
  validates :sale, inclusion: { in: [ true, false ] }
  private
end
