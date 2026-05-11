# syntax=docker/dockerfile:1
# check=error=true

# Questo Dockerfile è pensato per la produzione, non per lo sviluppo.
# Utilizzo con Kamal oppure manualmente:
#   docker build -t backend .
#   docker run -d -p 80:80 -e RAILS_MASTER_KEY=<valore da config/master.key> --name backend backend

# Per un ambiente di sviluppo containerizzato, vedi Dev Containers:
# https://guides.rubyonrails.org/getting_started_with_devcontainer.html

# Assicurarsi che RUBY_VERSION corrisponda alla versione in .ruby-version
ARG RUBY_VERSION=3.4.6
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

# Cartella di lavoro dell'applicazione Rails
WORKDIR /rails

# Installazione dei pacchetti base necessari a runtime:
# - postgresql-client: strumenti CLI per connettersi al database PostgreSQL
# - libjemalloc2:      allocatore di memoria alternativo per ridurre latenza e consumo RAM
# - libvips:           libreria per l'elaborazione di immagini (Active Storage)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl postgresql-client libjemalloc2 libvips && \
    ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Variabili d'ambiente per la produzione.
# jemalloc viene abilitato tramite LD_PRELOAD per ridurre l'uso di memoria e la latenza.
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"

# Stage intermedio di build (verrà scartato) per mantenere l'immagine finale leggera
FROM base AS build

# Pacchetti necessari solo in fase di compilazione delle gem:
# - build-essential: compilatori C/C++ per le gem con estensioni native
# - libpq-dev:       header e librerie per compilare la gem 'pg' (driver PostgreSQL)
# - git:             necessario per gem installate da sorgente Git
# - libyaml-dev:     header per la gem Psych (parser YAML)
# - pkg-config:      utility per individuare le librerie di sistema durante la build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential libpq-dev git libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Installazione delle gem dell'applicazione
COPY Gemfile Gemfile.lock vendor ./

RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile -j 1 --gemfile

# Copia del codice sorgente dell'applicazione
COPY . .

# Pre-compilazione di bootsnap per velocizzare i tempi di avvio.
# -j 1 disabilita la compilazione parallela per evitare un bug di QEMU:
# https://github.com/rails/bootsnap/issues/495
RUN bundle exec bootsnap precompile -j 1 app/ lib/


# Stage finale: immagine di produzione
FROM base

# Esecuzione come utente non-root per motivi di sicurezza
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash
USER 1000:1000

# Copia degli artefatti compilati dallo stage di build: gem e codice applicazione
COPY --chown=rails:rails --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --chown=rails:rails --from=build /rails /rails

# L'entrypoint si occupa della preparazione del database
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Avvio del server tramite Thruster (può essere sovrascritto a runtime)
EXPOSE 80
CMD ["./bin/thrust", "./bin/rails", "server"]