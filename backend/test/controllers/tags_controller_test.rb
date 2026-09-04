# test/controllers/tags_controller_test.rb
require "test_helper"

class TagsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @admin = admins(:one)
    @tag = tags(:Informatica)
    @valid_params = { tag: { name: "Nuovo Tag" } }
    @invalid_params = { tag: { name: "" } }
  end

  # ─── index ─────────────────────────────────────────────────────────
  test "should get index" do
    get tags_url
    assert_response :success
    assert_equal Tag.count, JSON.parse(response.body).size
  end

  # ─── create (admin only) ───────────────────────────────────────────
  test "should create tag as admin" do
    sign_in @admin

    assert_difference("Tag.count", 1) do
      post tags_url, params: @valid_params, as: :json
    end
    assert_response :created
    assert_equal "Nuovo Tag", JSON.parse(response.body)["name"]
  end

  test "should not create tag with invalid params" do
    sign_in @admin

    assert_no_difference("Tag.count") do
      post tags_url, params: @invalid_params, as: :json
    end
    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["error"]["details"].first, "Name"
  end

  test "should not allow non-admin to create tag" do
    # Utente non autenticato
    post tags_url, params: @valid_params, as: :json
    assert_response :unauthorized

    customer = customers(:Customer_Auth) rescue nil
    if customer
      sign_in customer
      post tags_url, params: @valid_params, as: :json
      assert_response :unauthorized
    end
  end

  # ─── update (admin only) ───────────────────────────────────────────
  test "should update tag as admin" do
    sign_in @admin

    patch tag_url(@tag), params: { tag: { name: "Modificato" } }, as: :json
    assert_response :ok
    @tag.reload
    assert_equal "Modificato", @tag.name
  end

  test "should not update tag with invalid params" do
    sign_in @admin

    patch tag_url(@tag), params: { tag: { name: "" } }, as: :json
    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["error"]["details"].first, "Name"
  end

  test "should not allow non-admin to update tag" do
    patch tag_url(@tag), params: { tag: { name: "Hack" } }, as: :json
    assert_response :unauthorized
  end

  # ─── destroy (admin only) ──────────────────────────────────────────
  test "should destroy tag as admin" do
    sign_in @admin

    assert_difference("Tag.count", -1) do
      delete tag_url(@tag), as: :json
    end
    assert_response :no_content
  end

  test "should not allow non-admin to destroy tag" do
    delete tag_url(@tag), as: :json
    assert_response :unauthorized
  end
end
