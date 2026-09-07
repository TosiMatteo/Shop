# Endpoint distruttivo: azzera il database e ricarica db/testseeds.rb.
# E' protetto da tre condizioni indipendenti, che devono valere tutte insieme:
#
#   1. l'ambiente e' development  -> altrove la rotta non viene nemmeno
#      dichiarata (vedi config/routes.rb);
#   2. ENABLE_TEST_HELPERS == "true" -> abilitazione esplicita, impostata solo
#      da .env.e2e;
#   3. il database in uso e' quello dedicato agli e2e -> anche con le prime due
#      soddisfatte, un errore di configurazione non puo' cancellare i dati di
#      sviluppo.
class TestHelpersController < ActionController::Base
  # Suffisso del database dedicato ai test end-to-end (vedi .env.e2e).
  E2E_DATABASE_SUFFIX = "_e2e"

  before_action :ensure_test_helpers_enabled
  before_action :ensure_e2e_database

  def reset
    load Rails.root.join("db/testseeds.rb")
    render json: { status: "ok" }
  end

  private

  # Helper non abilitato. Si mantiene il 404 (l'endpoint non deve risultare
  # esistente), ma con un suggerimento: la rotta e' dichiarata solo in
  # development, quindi qui non c'e' nulla da nascondere a un attaccante.
  def ensure_test_helpers_enabled
    return if ENV["ENABLE_TEST_HELPERS"] == "true"

    render json: {
      error: "Not found",
      hint: "ENABLE_TEST_HELPERS non e' attivo. Avvia lo stack con " \
            "--env-file .env.e2e."
    }, status: :not_found
  end

  # Database sbagliato: l'errore e' esplicito, cosi' il globalSetup di Playwright
  # segnala subito che lo stack e' partito senza --env-file .env.e2e.
  def ensure_e2e_database
    return if current_database.end_with?(E2E_DATABASE_SUFFIX)

    render json: {
      error: "Reset rifiutato: il database in uso e' '#{current_database}', " \
             "non un database e2e (atteso un nome con suffisso " \
             "'#{E2E_DATABASE_SUFFIX}'). Avvia lo stack con " \
             "--env-file .env.e2e."
    }, status: :forbidden
  end

  def current_database
    ActiveRecord::Base.connection_db_config.database.to_s
  end
end
