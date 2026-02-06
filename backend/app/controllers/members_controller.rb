class MembersController < ApplicationController
  before_action :authenticate_user!

  def show
    if current_customer
      render json: {
        user: {
          id: current_customer.id,
          email: current_customer.email,
          first_name: current_customer.first_name,
          last_name: current_customer.last_name,
          user_type: 'Customer',
          confirmed: current_customer.confirmed?,
          sign_in_count: current_customer.sign_in_count
        }
      }, status: :ok
    elsif current_admin
      render json: {
        user: {
          id: current_admin.id,
          email: current_admin.email,
          user_type: 'Admin',
          sign_in_count: current_admin.sign_in_count
        }
      }, status: :ok
    end
  end
end