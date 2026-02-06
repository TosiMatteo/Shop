# app/controllers/customers/registrations_controller.rb
class Customers::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  # POST /api/customers
  # Body: { 
  #   customer: { 
  #     email: "user@example.com", 
  #     password: "password123",
  #     password_confirmation: "password123",
  #     first_name: "Mario",
  #     last_name: "Rossi"
  #   } 
  # }
  def create
    build_resource(sign_up_params)

    resource.save
    yield resource if block_given?

    if resource.persisted?
      if resource.active_for_authentication?
        # Token JWT già generato da devise-jwt
        sign_up(resource_name, resource)
        respond_with_success(resource)
      else
        # Account creato ma richiede conferma email
        respond_with_pending_confirmation(resource)
      end
    else
      clean_up_passwords resource
      respond_with_error(resource)
    end
  end

  private

  def sign_up_params
    params.require(:customer).permit(:email, :password, :password_confirmation, :first_name, :last_name)
  end

  def respond_with_success(resource)
    render json: {
      message: 'Registrazione completata con successo',
      user: {
        id: resource.id,
        email: resource.email,
        first_name: resource.first_name,
        last_name: resource.last_name,
        user_type: 'Customer',
        confirmed: resource.confirmed?
      }
    }, status: :created
  end

  def respond_with_pending_confirmation(resource)
    render json: {
      message: 'Registrazione completata. Controlla la tua email per confermare l\'account.',
      user: {
        id: resource.id,
        email: resource.email,
        user_type: 'Customer',
        confirmed: false
      }
    }, status: :created
  end

  def respond_with_error(resource)
    render json: {
      errors: resource.errors.full_messages
    }, status: :unprocessable_entity
  end
end