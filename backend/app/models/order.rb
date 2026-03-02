class Order < ApplicationRecord
  belongs_to :customer
  has_many :order_items, dependent: :destroy

  enum :status, { processing: 0, completed: 1, cancelled: 2 }, default: :processing
  attribute :total, default: 0

  validates :total, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :shipping_street, presence: true
  validates :shipping_city, presence: true
  validates :shipping_zip, presence: true
  validates :shipping_name, presence: true

  accepts_nested_attributes_for :order_items
end
