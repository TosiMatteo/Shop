class CartsController < ApplicationController
  before_action :authenticate_customer!
  before_action :set_cart, only: %i[ show update destroy checkout]

  # GET /api/carts
  def index
    @carts = current_customer.cart

    render json: @carts
  end

  # GET /api/carts/1
  def show
    render json: @cart
  end

  # POST /api/carts
  def create
    @cart = Cart.new(cart_params)

    if @cart.save
      render json: @cart, status: :created, location: @cart
    else
      render json: @cart.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /api/carts/1
  def update
    if @cart.update(cart_params)
      render json: @cart
    else
      render json: @cart.errors, status: :unprocessable_content
    end
  end

  # DELETE /api/carts/1
  def destroy
    @cart.destroy!
    head :no_content
  end

  def checkout
    shipping_params = params.expect(shipping: [:name, :street, :city, :zip])
    begin
      order = @cart.checkout(shipping_params)
      render json: {
        id: order.id,
        total: order.total.to_s,
        status: order.status,
        shipping_name: order.shipping_name,
        order_items: order.order_items.count
      }, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages },
             status: :unprocessable_content
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_cart
      @cart = Cart.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def cart_params
      params.expect(cart: [ :customer_id ])
    end

  def shipping_params
    params.require(:shipping).permit(:street, :city, :zip_code, :name)
  end
end
