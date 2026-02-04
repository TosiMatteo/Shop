
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:4200", "http://172.18.0.4:4200"

    resource "*",
             headers: :any,
             methods: %i[get post put patch delete options head],
             expose: %w[Link X-Total-Count]
  end
end