class Product < ApplicationRecord
  has_many :product_tags, dependent: :destroy
  has_many :tags, through: :product_tags

  has_one_attached :thumbnail
  validates :title, presence: true, length: { minimum: 2, maximum: 50 }
  validates :description, presence: true, length: { minimum: 5, maximum: 1000 }
  validates :original_price, presence: true
  validates :sale, inclusion: { in: [ true, false ] }

  scope :search_by_title, ->(t) { t.present? ? where("title LIKE ?", "%#{t}%") : all }
  scope :search_by_tag, ->(t) { t.present? ? joins(:tags).where("tags.name LIKE ?", "%#{t}%") : all }
  scope :search_by_sale, ->(s) { s.present? && s.to_s == "true" ? where(sale: true) : all }
  scope :search_by_min_max_price, ->(min, max) {
    min_val = min.present? ? min.to_f : 0
    max_val = max.present? ? max.to_f : Float::INFINITY
    where(price: min_val..max_val)
  }

  scope :apply_sort, ->(sort) {
    case sort
    when "dateAsc"  then order(created_at: :asc)
    when "dateDesc" then order(created_at: :desc)
    when "priceAsc"  then order(price: :asc)
    when "priceDesc" then order(price: :desc)
    else all
    end
  }
end
