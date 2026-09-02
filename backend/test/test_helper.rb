ENV["RAILS_ENV"] ||= "test"
require 'simplecov'

SimpleCov.merge_timeout 3600

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
  add_filter '/app/controllers/test_helpers_controller.rb'

  add_group 'Controllers', 'app/controllers'
  add_group 'Models', 'app/models'

  # Soglia minima di copertura. In locale è disattivata (default 0) per non
  # bloccare lo sviluppo; la pipeline CI imposta MINIMUM_COVERAGE e fa fallire
  # il job se la copertura scende sotto quel valore.
  minimum_coverage_threshold = ENV.fetch("MINIMUM_COVERAGE", "0").to_i
  minimum_coverage minimum_coverage_threshold if minimum_coverage_threshold.positive?
end

require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallel_workers = ENV.fetch("PARALLEL_WORKERS", "1")
    parallel_workers = parallel_workers == "number_of_processors" ? :number_of_processors : parallel_workers.to_i
    parallelize(workers: parallel_workers)

    parallelize_setup do |worker|
      SimpleCov.command_name "Minitest-#{worker}"
    end

    parallelize_teardown do |_worker|
      SimpleCov.result
    end

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...

  end
end
