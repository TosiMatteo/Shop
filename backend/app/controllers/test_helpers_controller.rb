class TestHelpersController < ActionController::Base
  before_action :ensure_test_helpers_enabled

  def reset
    load Rails.root.join('db/testseeds.rb')
    render json: { status: 'ok' }
  end

  private

  def ensure_test_helpers_enabled
    unless ENV['ENABLE_TEST_HELPERS'] == 'true'
      render json: { error: 'Not found' }, status: :not_found
    end
  end
end