class ApplicationController < ActionController::API
  include Pagy::Method
  include ErrorHandler

  before_action :configure_permitted_parameters, if: :devise_controller?

  def current_user
    @current_user ||= current_customer || current_admin
  end

  def current_user_type
    return 'Customer' if current_customer
    return 'Admin' if current_admin
    nil
  end

  def authenticate_user!
    raise ErrorHandler::AuthenticationError unless current_user
  end

  def authenticate_admin!
    raise ErrorHandler::ForbiddenError unless current_admin
  end

  def authenticate_customer!
    raise ErrorHandler::ForbiddenError unless current_customer
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:first_name, :last_name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:first_name, :last_name])
  end
end