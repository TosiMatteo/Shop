class Customers::SessionsController < Devise::SessionsController
  respond_to :json
  private

  # Override response per login
  def respond_with(resource, _opts = {})
    if resource.active_for_authentication?
      render json: {
        message: 'Login effettuato con successo',
        user: {
          id: resource.id,
          email: resource.email,
          first_name: resource.first_name,
          last_name: resource.last_name,
          user_type: 'Customer',
          confirmed: resource.confirmed?
        }
      }, status: :ok
    else
      render json: {
        error: "Account non confermato o bloccato."
      }, status: :unauthorized
    end
  end

  # Override response per logout
  def respond_to_on_destroy(_resorce = nil)
      render json: {
        message: 'Logout effettuato con successo'
      }, status: :ok
  end
end