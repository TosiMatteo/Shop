class Admin < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  # Devise modules
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable,
         :trackable, :lockable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  validates :password, length: { minimum: 6 }, if: :password_required?

  before_validation :downcase_email

  def jwt_payload
    super.merge('user_type' => 'Admin')
  end

  # Associazioni future

  private

  def downcase_email
    self.email = email.downcase if email.present?
  end

  def password_required?
    !persisted? || password.present? || password_confirmation.present?
  end
end
