class ProductsController < ApplicationController
  # Actions pubbliche (non richiedono autenticazione)
  skip_before_action :authenticate_user!, only: [:index, :show]

  # Actions solo per admin
  before_action :authenticate_admin!, only: [:create, :update, :destroy]

  # GET /products
  def index
    filtered = Product
                 .includes(:tags)
                 .search_by_title(params[:title])
                 .search_by_tag(params[:tag])
                 .search_by_min_max_price(params[:min], params[:max])
                 .search_by_sale(params[:sale])
                 .apply_sort(params[:sort])

    @pagy, @products = pagy(:countish, filtered, ttl: 300, limit: (params[:limit] || 10).to_i)

    render json: {
      pagy: @pagy.data_hash,
      products: @products.map { |p|
        thumbnail_url = p.thumbnail.attached? ? url_for(p.thumbnail) : nil
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
