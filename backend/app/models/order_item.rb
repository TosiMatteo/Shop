class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :product

  validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 1, only_integer: true }
  validates :unit_price, presence: true, numericality: { greater_than_or_equal_to: 0 }

  # Callback per salvare il prezzo del prodotto se non specificato
  before_validation :set_unit_price_from_product, on: :create

  private
  def set_unit_price_from_product
    self.unit_price ||= product.price if product
  end
end
