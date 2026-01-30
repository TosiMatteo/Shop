class ProductsController < ApplicationController
  before_action :set_product, only: %i[ show update destroy ]

  # GET /products
  def index
    @products = Product.all

    if params[:tag].present?
      @products = @products.joins(:tags).where("tags.name = ?", params[:tag])
    end

    render json: @products.map { |product|
      thumbnail_url = product.thumbnail.attached? ? url_for(product.thumbnail) : nil
      product.as_json(include: :tags).merge({ thumbnail_url: thumbnail_url })
    }
  end

  # GET /products/1
  def show
    render json: @product.as_json(include: :tags)
  end

  # POST /products
  def create
    @product = Product.new(product_params)

    if @product.save
      render json: @product, status: :created, location: @product
    else
      render json: @product.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /products/1
  def update
    if @product.update(product_params)
      render json: @product
    else
      render json: @product.errors, status: :unprocessable_content
    end
  end

  # DELETE /products/1
  def destroy
    @product.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_product
      @product = Product.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def product_params
      params.expect(product: [ :title, :description, :price, :original_price, :sale, :thumbnail, { tag_ids: [] } ])
    end
end
