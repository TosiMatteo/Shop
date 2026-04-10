ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require 'simplecov'

SimpleCov.start 'rails' do
  add_filter '/bin/'
  add_filter '/config/'
  add_filter '/db/'
  add_filter '/log/'
  add_filter '/public/'
  add_filter '/script/'
  add_filter '/storage/'
  add_filter '/test/'
  add_filter '/tmp/'
  add_filter '/vendor/'
  add_filter '/app/mailers/'
  add_filter '/app/jobs/'
  add_filter '/lib/'

  add_group 'Controllers', 'app/controllers'
  add_group 'Models', 'app/models'
end

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...

  end
end