class TagsController < ApplicationController
  def index
    render json: Tag.all
  end
  # POST /api/tags
  def create
    @tag = Tag.new(tag_params)
    @tag.save!
    render json: @tag, status: :created
  end

  # PATCH /api/tags/:id
  def update
    @tag.update!(tag_params)
    render json: @tag, status: :ok
  end

  # DELETE /api/tags/:id
  def destroy
    @tag.destroy!
    head :no_content
  end

  private

  def set_tag
    @tag = Tag.find(params[:id])
  end

  def tag_params
    params.expect(tag: [:name])
  end
end