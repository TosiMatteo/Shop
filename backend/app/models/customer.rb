class Customer < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  # Devise modules for customer authentication and account lifecycle.
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :lockable, :trackable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  # Basic profile and credential validations.
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :password, length: { minimum: 6 }, if: :password_required?
  validates :email, presence: true, uniqueness: true

  # Normalize email and ensure JWT identifier exists.
  before_validation :downcase_email
  before_validation :ensure_jti_present

  # Extend JWT payload with customer metadata.
  def jwt_payload
    super.merge(
      'user_type' => 'Customer',
      'first_name' => first_name,
      'last_name' => last_name
    )
  end

  # Domain relationships.
  has_many :orders, dependent: :destroy
  has_one :cart, dependent: :destroy

  private

  # Store emails consistently for lookup/uniqueness.
  def downcase_email
    self.email = email.downcase if email.present?
  end

  # Devise: password required for new records or explicit changes.
  def password_required?
    !persisted? || password.present? || password_confirmation.present?
  end

  # Ensure JWT revocation token is present.
  def ensure_jti_present
    self.jti ||= SecureRandom.uuid
  end

  # Avoid Devise trackable updates for customers (handled elsewhere/no-op).
  def update_tracked_fields!(request)
    # no-op
  end
end
