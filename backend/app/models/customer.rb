class Customer < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  # Devise modules
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :lockable, :trackable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :password, length: { minimum: 8 }, if: :password_required?

  before_validation :downcase_email

  def jwt_payload
    super.merge(
      'user_type' => 'Customer',
      'first_name' => first_name,
      'last_name' => last_name
    )
  end

  # Associazioni future
  # has_many :orders, dependent: :destroy
  # has_one :cart, dependent: :destroy

  private

  def downcase_email
    self.email = email.downcase if email.present?
  end

  def password_required?
    !persisted? || password.present? || password_confirmation.present?
  end
end
