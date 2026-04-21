class ApplicationController < ActionController::API
  include Pagy::Method
  include ErrorHandler

  # Allow extra Devise params only for Devise controllers.
  before_action :configure_permitted_parameters, if: :devise_controller?

  # Returns the first authenticated principal across supported roles.
  def current_user
    @current_user ||= current_customer || current_admin
  end

  # String identifier for the current principal's role.
  def current_user_type
    return 'Customer' if current_customer
    return 'Admin' if current_admin
    nil
  end

  # Generic auth gate for any authenticated principal.
  def authenticate_user!
    raise ErrorHandler::AuthenticationError unless current_user
  end

  # Auth gate for admin scope via Devise/Warden.
  def authenticate_admin!
    admin = warden.authenticate(scope: :admin)
    raise ErrorHandler::AuthenticationError if admin.nil?
  end

  # Auth gate for customer scope via Devise/Warden.
  def authenticate_customer!
    customer = warden.authenticate(scope: :customer)
    raise ErrorHandler::AuthenticationError if customer.nil?
  end

  protected

  # Permit extra profile attributes during Devise sign up and update.
  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:first_name, :last_name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:first_name, :last_name])
  end
end
