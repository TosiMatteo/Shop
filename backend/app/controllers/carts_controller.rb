class CartsController < ApplicationController
  before_action :authenticate_customer!
  before_action :set_cart, only: %i[ show update destroy checkout]

  # GET /api/carts
  def index
    @cart = current_customer.cart
    if @cart
      render json: cart_json(@cart)
    else
      render json: nil
    end
  end

  def show
    render json: cart_json(@cart)
  end

  # POST /api/carts
  def create
    @cart = Cart.new(cart_params)
    @cart.save!
    render json: @cart, status: :created, location: @cart
  end

  # PATCH/PUT /api/carts/1
  def update
    @cart.update!(cart_params)
    render json: @cart
  end

  # DELETE /api/carts/1
  def destroy
    @cart.destroy!
    head :no_content
  end

  def checkout
    shipping_params = params.expect(shipping: [:name, :street, :city, :zip])
    order = @cart.checkout(shipping_params)
    render json: {
      id: order.id,
      total: order.total.to_s,
      status: order.status,
      shipping_name: order.shipping_name,
      order_items: order.order_items.count
    }, status: :created
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_cart
      @cart = current_customer.cart
      raise ActiveRecord::RecordNotFound unless @cart && @cart.id == params[:id].to_i
    end

    # Only allow a list of trusted parameters through.
    def cart_params
      params.expect(cart: [ :customer_id ])
    end

    def cart_json(cart)
      cart.as_json.merge(
        items: cart.cart_items.includes(:product).map do |ci|
          ci.as_json.merge(product: ci.product)
        end,
        total_price: cart.total_price
      )
    end
end
