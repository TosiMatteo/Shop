class OrdersController < ApplicationController
  before_action :authenticate_customer!
  before_action :set_order, only: %i[ show update destroy ]

  # GET /api/orders
  def index
    if params[:min].present? && params[:max].present? && params[:min].to_f > params[:max].to_f
      return render_error(status: :bad_request, message: 'Min must be less than max')
    end

    filtered = current_customer.orders
                               .includes(order_items: :product)
                               .search_by_min_max_total(params[:min], params[:max])
                               .apply_sort(params[:sort])

    @pagy, @orders = pagy(:countish, filtered, ttl: 300, limit: (params[:limit] || 10).to_i)

    render json: {
      pagy: @pagy.data_hash,
      orders: @orders.map { |o|
        o.as_json.merge(
          order_items: o.order_items.map { |item|
            item.as_json.merge(product: item.product.as_json(only: [:id, :title]))
          }
        )
      }
    }
  end


  # GET /api/orders/1
  def show
    render json: @order.as_json.merge(
      order_items: @order.order_items.includes(:product).map { |item|
        item.as_json.merge(product: item.product.as_json(only: [:id, :title]))
      }
    )
  end

  # POST /api/orders
  def create
    @order = Order.new(order_params)
    @order.save!
    render json: @order, status: :created, location: @order
  end

  # PATCH/PUT /api/orders/1
  def update
    @order.update!(order_update_params)
    render json: @order
  end

  # DELETE /api/orders/1
  def destroy
    @order.destroy!
    head :no_content
  end

  private
  def set_order
    @order = current_customer.orders.find(params.expect(:id))
  end

  def order_params
    params.expect(order: [ :customer_id, :shipping_name, :shipping_street, :shipping_city, :shipping_zip ])
  end

  def order_update_params
    params.expect(order: [ :shipping_name, :shipping_street, :shipping_city, :shipping_zip, :status ])
  end
end