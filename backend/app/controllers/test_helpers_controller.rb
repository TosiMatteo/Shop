class TestHelpersController < ActionController::Base
  protect_from_forgery with: :null_session

  def reset
    load Rails.root.join('db/testseeds.rb')
    render json: { status: 'ok' }
  end
end