# app/controllers/customers/passwords_controller.rb
class Customers::PasswordsController < Devise::PasswordsController
  respond_to :json

  # POST /api/customers/password
  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      render json: {
        message: 'Email inviata con successo. Controlla la tua casella di posta.'
      }, status: :ok
    else
      render_error(status: :unprocessable_entity, message: "Validation failed", details: resource.errors.full_messages)
    end
  end

  # PUT /api/customers/password
  def update
    self.resource = resource_class.reset_password_by_token(resource_params)
    yield resource if block_given?

    if resource.errors.empty?
      resource.unlock_access! if unlockable?(resource)

      render json: {
        message: 'Password cambiata con successo'
      }, status: :ok
    else
      render_error(status: :unprocessable_entity, message: "Validation failed", details: resource.errors.full_messages)
    end
  end

  # GET /api/customers/password/edit?reset_password_token=TOKEN
  def edit
    redirect_to "#{ENV.fetch('FRONTEND_URL', 'http://localhost:4200')}/reset-password?reset_password_token=#{params[:reset_password_token]}",
                allow_other_host: true
  end

  protected

  def resource_params
    params.require(:customer).permit(:email, :reset_password_token, :password, :password_confirmation)
  end
end