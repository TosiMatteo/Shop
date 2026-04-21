class Cart < ApplicationRecord
  # A cart belongs to one customer and holds many products via cart items.
  belongs_to :customer
  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items

  # Calculates the current total by summing item quantities * product prices.
  def total_price
    cart_items.joins(:product).sum('cart_items.quantity * products.price')
  end

  # Creates an order from the cart, then clears the cart in a transaction.
  def checkout (shipping_params)
    if cart_items.empty?
      errors.add(:base, "Empty cart")
      raise ActiveRecord::RecordInvalid, self
    end
    ActiveRecord::Base.transaction do
      cart_total = total_price
      order = Order.create!(total: cart_total,
                            status: :processing,
                            customer_id: customer_id,
                            shipping_street: shipping_params[:street],
                            shipping_city: shipping_params[:city],
                            shipping_zip: shipping_params[:zip],
                            shipping_name: shipping_params[:name])
      cart_items.includes(:product).each do |cart_item|
        OrderItem.create!(order: order,
                          product: cart_item.product,
                          quantity: cart_item.quantity,
                          unit_price: cart_item.product.price)
      end
      destroy
      order
    end
  end
end
