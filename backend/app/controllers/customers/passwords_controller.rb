# app/controllers/customers/passwords_controller.rb
class Customers::PasswordsController < Devise::PasswordsController
  respond_to :json

  # POST /api/customers/password
  # Body: { customer: { email: "user@example.com" } }
  # Invia email con link per reset password
  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      render json: {
        message: 'Email inviata con successo. Controlla la tua casella di posta.'
      }, status: :ok
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PUT /api/customers/password
  # Body: {
  #   customer: {
  #     reset_password_token: "abc123",
  #     password: "newpassword123",
  #     password_confirmation: "newpassword123"
  #   }
  # }
  # Resetta la password con il token ricevuto via email
  def update
    self.resource = resource_class.reset_password_by_token(resource_params)
    yield resource if block_given?

    if resource.errors.empty?
      resource.unlock_access! if unlockable?(resource)

      render json: {
        message: 'Password cambiata con successo'
      }, status: :ok
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  protected

  def resource_params
    params.require(:customer).permit(:email, :reset_password_token, :password, :password_confirmation)
  end
end