module ErrorHandler
  extend ActiveSupport::Concern
  # Custom errors raised by controllers/services for authz/authn flows.
  class AuthenticationError < StandardError; end
  class ForbiddenError < StandardError; end

  included do
    # Map framework and domain errors to consistent JSON responses.
    rescue_from StandardError,                        with: :handle_internal_server_error
    rescue_from ActiveRecord::RecordNotFound,         with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid,          with: :handle_unprocessable_entity
    rescue_from ActiveRecord::RecordNotDestroyed,     with: :handle_unprocessable_entity
    rescue_from ActionController::ParameterMissing,   with: :handle_bad_request
    rescue_from JWT::DecodeError,                     with: :handle_unauthorized
    rescue_from AuthenticationError,                  with: :handle_unauthorized
    rescue_from ForbiddenError,                       with: :handle_forbidden
  end

  private

  # Renders a standard error payload with optional details.
  def render_error(status:, message:, details: nil)
    payload = { error: { message: message } }
    payload[:error][:details] = details if details.present?
    render json: payload, status: status
  end

  # 404 - model not found
  def handle_not_found(exception)
    render_error(status: :not_found, message: exception.message)
  end

  # 422 - validation or persistence failures
  def handle_unprocessable_entity(exception)
    render_error(status: :unprocessable_entity, message: "Validation failed", details: exception.record.errors.full_messages)
  end

  # 400 - required parameters missing
  def handle_bad_request(exception)
    render_error(status: :bad_request, message: "Missing required parameter: #{exception.param}")
  end

  # 401 - authentication missing/invalid
  def handle_unauthorized(_exception)
    render_error(status: :unauthorized, message: "Authentication required")
  end

  # 403 - authenticated but not allowed
  def handle_forbidden(_exception)
    render_error(status: :forbidden, message: "Access denied")
  end

  # 500 - fallthrough for unexpected errors
  def handle_internal_server_error(exception)
    Rails.logger.error("#{exception.class}: #{exception.message}\n#{exception.backtrace&.first(10)&.join("\n")}")
    render_error(status: :internal_server_error, message: "An unexpected error occurred")
  end
end
