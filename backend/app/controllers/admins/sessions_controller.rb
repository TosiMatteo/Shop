# app/controllers/admins/sessions_controller.rb
class Admins::SessionsController < Devise::SessionsController
  respond_to :json

  # POST /api/admins/sing_in
  def create
    super
  end

  # DELETE /api/admins/sign_out
  def destroy
    super
  end

  private

  def respond_with(resource, _opts = {})
    render json: {
      message: 'Login admin effettuato con successo',
      user: {
        id: resource.id,
        email: resource.email,
        user_type: 'Admin',
        sign_in_count: resource.sign_in_count
      }
    }, status: :ok
  end

  def respond_to_on_destroy
    if current_admin
      render json: {
        message: 'Logout effettuato con successo'
      }, status: :ok
    else
      render json: {
        error: 'Utente non autenticato'
      }, status: :unauthorized
    end
  end
end