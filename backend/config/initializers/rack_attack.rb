class Rack::Attack

  ### SAFELIST ###
  if Rails.env.development?
    safelist("allow-localhost") do |req|
      req.ip == "127.0.0.1" || req.ip == "::1"
    end
  end

  ### THROTTLE: Login Customer ###
  throttle("customers/logins/ip", limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == "/api/customers/sign_in" && req.post?
  end

  throttle("customers/logins/email", limit: 5, period: 20.seconds) do |req|
    if req.path == "/api/customers/sign_in" && req.post?
      body = JSON.parse(req.body.read) rescue {}
      req.body.rewind
      body.dig("customer", "email")&.downcase&.strip
    end
  end

  ### THROTTLE: Login Admin ###
  throttle("admins/logins/ip", limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == "/api/admins/sign_in" && req.post?
  end

  throttle("admins/logins/email", limit: 5, period: 20.seconds) do |req|
    if req.path == "/api/admins/sign_in" && req.post?
      body = JSON.parse(req.body.read) rescue {}
      req.body.rewind
      body.dig("admin", "email")&.downcase&.strip
    end
  end

  ### THROTTLE: Registrazione Customer ###
  throttle("customers/signups/ip", limit: 3, period: 10.minutes) do |req|
    req.ip if req.path == "/api/customers" && req.post?
  end

  ### THROTTLE: Generico per IP ###
  throttle("req/ip", limit: 300, period: 1.minute) do |req|
    req.ip
  end

  ### RISPOSTA 429 ###
  self.throttled_responder = lambda do |req|
    retry_after = (req.env["rack.attack.match_data"] || {})[:period]
    [
      429,
      {
        "Content-Type" => "application/json",
        "Retry-After" => retry_after.to_s
      },
      [{ error: "Troppe richieste. Riprova più tardi." }.to_json]
    ]
  end
end

