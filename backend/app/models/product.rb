class Product < ApplicationRecord
  has_one_attached :thumbnail
  validate :thumbnail_attached?
  validates :title, presence: true, length: { minimum: 2, maximum: 50 }
  validates :description, presence: true, length: { minimum: 5, maximum: 1000 }
  validates :original_price, presence: true
  validates :sale, inclusion: { in: [ true, false ] }
  private
  def thumbnail_attached?
    errors.add(:thumbnail, "must be attached") unless thumbnail.attached?
  end
end
