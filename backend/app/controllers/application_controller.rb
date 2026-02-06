class ApplicationController < ActionController::API
  include Pagy::Method

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
    unless current_user
      render json: { error: 'Non autorizzato' }, status: :unauthorized
    end
  end

  def authenticate_admin!
    unless current_admin
      render json: { error: 'Accesso riservato agli amministratori' }, status: :forbidden
    end
  end

  def authenticate_customer!
    unless current_customer
      render json: { error: 'Accesso riservato ai clienti' }, status: :forbidden
    end
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:first_name, :last_name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:first_name, :last_name])
  end
end