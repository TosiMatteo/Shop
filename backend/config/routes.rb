Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # Raggruppiamo tutto sotto /api
  scope :api, defaults: { format: :json } do
      # --- AUTH: Endpoint Profilo Utente ---
      get '/me', to: 'members#show'

      # --- AUTH: Customer ---
      devise_for :customers,
                 path: 'customers',
                 controllers: {
                   sessions: 'customers/sessions',
                   registrations: 'customers/registrations',
                   passwords: 'customers/passwords',
                   confirmations: 'customers/confirmations'
                 }

      # --- AUTH: Admin ---
      devise_for :admins,
                 path: 'admins',
                 controllers: {
                   sessions: 'admins/sessions',
                   passwords: 'admins/passwords'
                 },
                 skip: [:registrations] # Gli admin non si registrano da soli

      # --- RISORSE
      resources :products
      resources :tags, only: [:index, :update, :create, :destroy]
      resources :orders, only: [:index, :show, :create, :update, :destroy]
      resources :carts, only: [:index, :show, :create, :destroy, :update] do
        member do
          post :checkout #POST /api/carts/:id/checkout
        end
        resources :cart_items,shallow: true, only: [:create, :destroy, :update]
      end
  end
end
