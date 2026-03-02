# app/controllers/admins/passwords_controller.rb
class Admins::PasswordsController < Devise::PasswordsController
  respond_to :json

  # POST /api/admins/password
  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      render json: {
        message: 'Email inviata con successo'
      }, status: :ok
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PUT /api/admins/password
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
    params.require(:admin).permit(:email, :reset_password_token, :password, :password_confirmation)
  end
end