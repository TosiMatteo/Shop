class Order < ApplicationRecord
  belongs_to :customer
  has_many :order_items, dependent: :destroy

  enum :status, [ processing: 0, completed: 1, cancelled: 2 ]

  validates :total, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :shipping_street, presence: true
  validates :shipping_city, presence: true
  validates :shipping_zip, presence: true
end
