class CartItem < ApplicationRecord
  belongs_to :cart
  belongs_to :product
  validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 1, only_integer: true }
  validates :product_id, presence: true, uniqueness: { scope: :cart_id, message: "già presente nel carrello" }
end
