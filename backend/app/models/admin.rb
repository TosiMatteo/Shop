class Admin < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  # Devise modules for admin authentication and account lifecycle.
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable,
         :trackable, :lockable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  # Credential validations.
  validates :password, length: { minimum: 6 }, if: :password_required?
  validates :email, presence: true, uniqueness: true

  # Normalize email before validation.
  before_validation :downcase_email

  # Extend JWT payload with admin role marker.
  def jwt_payload
    super.merge('user_type' => 'Admin')
  end

  # Future domain relationships.

  private

  # Store emails consistently for lookup/uniqueness.
  def downcase_email
    self.email = email.downcase if email.present?
  end

  # Devise: password required for new records or explicit changes.
  def password_required?
    !persisted? || password.present? || password_confirmation.present?
  end
end
