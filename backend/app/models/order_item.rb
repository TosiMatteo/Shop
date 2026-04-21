class OrderItem < ApplicationRecord
  # Line item for an order, linked to a product.
  belongs_to :order
  belongs_to :product

  # Quantity and price validations.
  validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 1, only_integer: true }
  validates :unit_price, presence: true, numericality: { greater_than_or_equal_to: 0 }

  # Capture product price at order time if not provided.
  before_validation :set_unit_price_from_product, on: :create

  private
  # Default unit price from associated product.
  def set_unit_price_from_product
    self.unit_price ||= product.price if product
  end
end
