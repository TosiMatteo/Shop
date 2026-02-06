# frozen_string_literal: true

class CustomAuthFailure < Devise::FailureApp
  def respond
    if request.format == :json || api_request?
      json_error_response
    else
      super
    end
  end

  def json_error_response
    self.status = 401
    self.content_type = 'application/json'
    self.response_body = {
      error: i18n_message,
      message: 'Non autorizzato'
    }.to_json
  end

  private

  def api_request?
    request.path.start_with?('/api/')
  end
end
