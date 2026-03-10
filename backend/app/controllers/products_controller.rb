class ProductsController < ApplicationController

  # Actions solo per admin
  before_action :authenticate_admin!, only: [:create, :update, :destroy]

  before_action :set_product, only: %i[ update destroy show]

  # GET /products
  def index
    filtered = Product
                 .includes(:tags, thumbnail_attachment: { blob: :variant_records })
                 .search_by_title(params[:title])
                 .search_by_tag(params[:tag])
                 .search_by_min_max_price(params[:min], params[:max])
                 .search_by_sale(params[:sale])
                 .apply_sort(params[:sort])

    @pagy, @products = pagy(:countish, filtered, ttl: 300, limit: (params[:limit] || 12).to_i)

    render json: {
      pagy: @pagy.data_hash,
      products: @products.map { |p|
        thumbnail_url = p.thumbnail.attached? ? rails_representation_path(p.thumbnail.variant(resize_to_limit: [300, 300])) : nil
        p.as_json(include: :tags).merge({ thumbnail_url: thumbnail_url })
      }
    }
  end

  # GET /products/1
  def show
    render json: @product.as_json(include: :tags)
  end

  # POST /products
  def create
    @product = Product.new(product_params)
    @product.save!
    render json: @product, status: :created, location: @product
  end

  # PATCH/PUT /products/1
  def update
    @product.update!(product_params)
    render json: @product
  end

  # DELETE /products/1
  def destroy
    @product.destroy!
    head :no_content
  end

  private
  def set_product
    @product = Product.find(params.expect(:id))
  end

  def product_params
    params.expect(product: [ :title, :description, :price, :original_price, :sale, :thumbnail, { tag_ids: [] } ])
  end
end