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

  scope :search_by_min_max_total, ->(min, max) {
    scope = where(nil)
    scope = scope.where("total >= ?", min.to_f) if min.present?
    scope = scope.where("total <= ?", max.to_f) if max.present?
    scope
  }

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