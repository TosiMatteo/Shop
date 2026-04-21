class CartItem < ApplicationRecord
  # Join model between cart and product.
  belongs_to :cart
  belongs_to :product
  # Quantity must be a positive integer.
  validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 1, only_integer: true }
  # A product can appear only once per cart.
  validates :product_id, presence: true, uniqueness: { scope: :cart_id, message: "già presente nel carrello" }
end
