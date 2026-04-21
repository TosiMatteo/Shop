class Order < ApplicationRecord
  # An order belongs to a customer and has line items.
  belongs_to :customer
  has_many :order_items, dependent: :destroy

  # Order lifecycle status.
  enum :status, { processing: 0, completed: 1, cancelled: 2 }, default: :processing
  # Default total for new orders.
  attribute :total, default: 0

  # Shipping and total validations.
  validates :total, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :shipping_street, presence: true
  validates :shipping_city, presence: true
  validates :shipping_zip, presence: true
  validates :shipping_name, presence: true

  # Allow order items to be created/updated with the order.
  accepts_nested_attributes_for :order_items

  # Filter orders by minimum/maximum total.
  scope :search_by_min_max_total, ->(min, max) {
    scope = where(nil)
    scope = scope.where("total >= ?", min.to_f) if min.present?
    scope = scope.where("total <= ?", max.to_f) if max.present?
    scope
  }

  # Filter orders by status.
  scope :search_by_status, ->(status) {
    scope = where(nil)
    scope = scope.where(status: status) if status.present?
    scope
  }

  # Filter orders by creation year.
  scope :search_by_year, ->(year) {
    scope = where(nil)
    scope = scope.where("extract(year from created_at) = ?", year) if year.present?
    scope
  }

  # Apply API sort options with a safe default.
  scope :apply_sort, ->(sort) {
    case sort
    when "dateAsc"   then order(created_at: :asc)
    when "dateDesc"  then order(created_at: :desc)
    when "totalAsc"  then order(total: :asc)
    when "totalDesc" then order(total: :desc)
    else order(created_at: :desc)
    end
  }
end
