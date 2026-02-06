class Customers::PasswordsController < Devise::PasswordsController
  respond_to :json

  # POST /api/customers/password
  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      render json: { message: "Email di reset inviata con successo." }, status: :ok
    else
      render json: { error: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PUT /api/customers/password
  def update
    self.resource = resource_class.reset_password_by_token(resource_params)
    yield resource if block_given?

    if resource.errors.empty?
      resource.unlock_access! if unlockable?(resource)
      render json: { message: "Password aggiornata con successo. Ora puoi fare login." }, status: :ok
    else
      render json: { error: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end
end