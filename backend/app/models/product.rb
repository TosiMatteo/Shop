class Product < ApplicationRecord
  # Tagging and commerce relationships.
  has_many :product_tags, dependent: :destroy
  has_many :tags, through: :product_tags
  has_many :cart_items, dependent: :destroy
  has_many :order_items, dependent: :destroy

  # Product image via Active Storage.
  has_one_attached :thumbnail
  # Core product validations.
  validates :title, presence: true, length: { minimum: 2, maximum: 50 }
  validates :description, presence: true, length: { minimum: 5, maximum: 1000 }
  validates :original_price, presence: true
  validates :sale, inclusion: { in: [ true, false ] }

  # Filter by partial title match.
  scope :search_by_title, ->(title) {
    scope = where(nil)
    scope = scope.where("title LIKE ?", "%#{title}%") if title.present?
    scope
  }

  # Filter by associated tag name.
  scope :search_by_tag, ->(tag) {
    scope = where(nil)
    scope = scope.joins(:tags).where("tags.name LIKE ?", "%#{tag}%") if tag.present?
    scope
  }

  # Filter products on sale.
  scope :search_by_sale, ->(sale) {
    scope = where(nil)
    scope = scope.where(sale: true) if sale.present? && sale.to_s == "true"
    scope
  }

  # Filter by price range.
  scope :search_by_min_max_price, ->(min, max) {
    scope = where(nil)
    scope = scope.where("price >= ?", min.to_f) if min.present?
    scope = scope.where("price <= ?", max.to_f) if max.present?
    scope
  }

  # Apply API sort options with a safe default.
  scope :apply_sort, ->(sort) {
    case sort
    when "dateAsc"  then order(created_at: :asc)
    when "dateDesc" then order(created_at: :desc)
    when "priceAsc"  then order(price: :asc)
    when "priceDesc" then order(price: :desc)
    else order(created_at: :desc)
    end
  }
end
