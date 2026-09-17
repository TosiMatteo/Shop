require "test_helper"

class TagsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @admin = admins(:one)
    @customer = customers(:Customer_Auth)
    @tag = tags(:Informatica)
    @valid_params = { tag: { name: "Nuovo Tag" } }
    @invalid_params = { tag: { name: "" } }
  end

  # ─── Index ─────────────────────────────────────────────────────────────────
  test "should get index" do
    get tags_url, as: :json

    assert_response :ok
    assert_equal Tag.count, response.parsed_body.size
  end

  # ─── Create (solo admin) ───────────────────────────────────────────────────
  test "should create tag as admin" do
    sign_in @admin

    assert_difference("Tag.count", 1) do
      post tags_url, params: @valid_params, as: :json
    end

    assert_response :created
    assert_equal "Nuovo Tag", response.parsed_body["name"]
  end

  test "should not create tag with invalid params" do
    sign_in @admin

    assert_no_difference("Tag.count") do
      post tags_url, params: @invalid_params, as: :json
    end

    assert_response :unprocessable_content
    assert_includes response.parsed_body["error"]["details"].first, "Name"
  end

  test "should not allow an unauthenticated user to create tag" do
    assert_no_difference("Tag.count") do
      post tags_url, params: @valid_params, as: :json
    end

    assert_response :unauthorized
  end

  test "should not allow a customer to create tag" do
    sign_in @customer

    assert_no_difference("Tag.count") do
      post tags_url, params: @valid_params, as: :json
    end

    assert_response :unauthorized
  end

  # ─── Update (solo admin) ───────────────────────────────────────────────────
  test "should update tag as admin" do
    sign_in @admin

    patch tag_url(@tag), params: { tag: { name: "Modificato" } }, as: :json

    assert_response :ok
    assert_equal "Modificato", @tag.reload.name
  end

  test "should not update tag with invalid params" do
    sign_in @admin

    patch tag_url(@tag), params: @invalid_params, as: :json

    assert_response :unprocessable_content
    assert_includes response.parsed_body["error"]["details"].first, "Name"
  end

  test "should not allow an unauthenticated user to update tag" do
    patch tag_url(@tag), params: { tag: { name: "Hack" } }, as: :json

    assert_response :unauthorized
    assert_equal "Informatica", @tag.reload.name
  end

  test "should not allow a customer to update tag" do
    sign_in @customer

    patch tag_url(@tag), params: { tag: { name: "Hack" } }, as: :json

    assert_response :unauthorized
    assert_equal "Informatica", @tag.reload.name
  end

  # ─── Destroy (solo admin) ──────────────────────────────────────────────────
  test "should destroy tag as admin" do
    sign_in @admin

    assert_difference("Tag.count", -1) do
      delete tag_url(@tag), as: :json
    end

    assert_response :no_content
  end

  test "should not allow an unauthenticated user to destroy tag" do
    assert_no_difference("Tag.count") do
      delete tag_url(@tag), as: :json
    end

    assert_response :unauthorized
  end

  test "should not allow a customer to destroy tag" do
    sign_in @customer

    assert_no_difference("Tag.count") do
      delete tag_url(@tag), as: :json
    end

    assert_response :unauthorized
  end
end
