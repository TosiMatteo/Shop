class OrdersController < ApplicationController
  before_action :authenticate_customer!
  before_action :set_order, only: %i[ show update destroy ]

  # GET /api/orders
  def index
    @orders = current_customer.orders
    render json: @orders
  end

  # GET /api/orders/1
  def show
    render json: @order
  end

  # POST /api/orders
  def create
    @order = Order.new(order_params)

    if @order.save
      render json: @order, status: :created, location: @order
    else
      render json: @order.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /api/orders/1
  def update
    if @order.update(order_update_params)
      render json: @order
    else
      render json: @order.errors, status: :unprocessable_content
    end
  end

  # DELETE /api/orders/1
  def destroy
    @order.destroy!
    head :no_content
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_order
      @order = Order.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def order_params
      params.expect(order: [ :customer_id, :shipping_name, :shipping_street, :shipping_city, :shipping_zip ])
    end
    def order_update_params
      params.expect(order: [:shipping_name, :shipping_street, :shipping_city, :shipping_zip, :status ])
    end
end
