# app/controllers/customers/confirmations_controller.rb
class Customers::ConfirmationsController < Devise::ConfirmationsController
  respond_to :json

  # POST /api/customers/confirmation
  # Body: { customer: { email: "user@example.com" } }
  # Reinvia email di conferma
  def create
    self.resource = resource_class.send_confirmation_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      render json: {
        message: 'Email di conferma inviata con successo'
      }, status: :ok
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /api/customers/confirmation?confirmation_token=abc123
  # Conferma l'account (chiamato dal link nell'email)
  def show
    self.resource = resource_class.confirm_by_token(params[:confirmation_token])
    yield resource if block_given?

    if resource.errors.empty?
      # In una SPA Angular, potresti voler fare redirect al frontend
      # redirect_to "http://localhost:4200/confirmation-success"

      render json: {
        message: 'Account confermato con successo. Ora puoi effettuare il login.',
        user: {
          id: resource.id,
          email: resource.email,
          confirmed: true
        }
      }, status: :ok
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  protected

  def resource_params
    params.require(:customer).permit(:email)
  end
end