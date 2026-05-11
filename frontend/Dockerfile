# Usa un'immagine ufficiale di Node (versione 22 per supportare Angular 20)
FROM node:22

# Imposta la cartella di lavoro dentro il container
WORKDIR /app

# Installa Chromium e le dipendenze necessarie
RUN apt-get update && apt-get install -y chromium && rm -rf /var/lib/apt/lists/*

# Imposta il percorso del browser per Karma
ENV CHROME_BIN=chromium

RUN npm install -g @angular/cli

# Copia prima i file delle dipendenze (per sfruttare la cache di Docker)
COPY package.json package-lock.json ./

# Installa le dipendenze del progetto
RUN npm install

# Copia tutto il resto del codice sorgente nel container
COPY . .

# Espone la porta 4200 (quella di default di Angular)
EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "2000", "--proxy-config", "proxy.conf.json"]
