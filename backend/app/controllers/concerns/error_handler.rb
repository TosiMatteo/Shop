module ErrorHandler
  extend ActiveSupport::Concern
  class AuthenticationError < StandardError; end
  class ForbiddenError < StandardError; end

  included do
    rescue_from StandardError,                      with: :handle_internal_server_error
    rescue_from ActiveRecord::RecordNotFound,       with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid,        with: :handle_unprocessable_entity
    rescue_from ActionController::ParameterMissing, with: :handle_bad_request
    rescue_from JWT::DecodeError,                   with: :handle_unauthorized
    rescue_from AuthenticationError,                with: :handle_unauthorized
    rescue_from ForbiddenError,                     with: :handle_forbidden
  end

  private

  def render_error(status:, message:, details: nil)
    payload = { error: { message: message } }
    payload[:error][:details] = details if details.present?
    render json: payload, status: status
  end

  def handle_not_found(exception)
    render_error(status: :not_found, message: exception.message)
  end

  def handle_unprocessable_entity(exception)
    render_error(status: :unprocessable_entity, message: "Validation failed", details: exception.record.errors.full_messages)
  end

  def handle_bad_request(exception)
    render_error(status: :bad_request, message: "Missing required parameter: #{exception.param}")
  end

  def handle_unauthorized(_exception)
    render_error(status: :unauthorized, message: "Authentication required")
  end

  def handle_forbidden(_exception)
    render_error(status: :forbidden, message: "Access denied")
  end

  def handle_internal_server_error(exception)
    Rails.logger.error("#{exception.class}: #{exception.message}\n#{exception.backtrace&.first(10)&.join("\n")}")
    render_error(status: :internal_server_error, message: "An unexpected error occurred")
  end
end