class CartItemsController < ApplicationController
  before_action :set_cart_item, only: %i[ update destroy ]

  # POST /api/carts/:cart_id/cart_items
  def create
    cart = Cart.find_by!(id: params[:cart_id], customer: current_customer)
    existing = cart.cart_items.find_by(product_id: cart_item_params[:product_id])

    if existing
      existing.update!(quantity: existing.quantity + cart_item_params[:quantity].to_i)
      render json: existing, status: :ok
    else
      @cart_item = cart.cart_items.build(cart_item_params)
      @cart_item.save!
      render json: @cart_item, status: :created
    end
  end

  # PATCH/PUT /api/cart_items/:id
  def update
    @cart_item.update!(cart_item_params)
    render json: @cart_item
  end

  # DELETE /api/cart_items/:id
  def destroy
    @cart_item.destroy!
    head :no_content
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_cart_item
      @cart_item = CartItem.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def cart_item_params
      params.expect(cart_item: [:product_id, :quantity])
    end
end
