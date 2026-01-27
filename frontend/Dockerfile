# Usa un'immagine ufficiale di Node (versione 22 per supportare Angular 20)
FROM node:22

# Imposta la cartella di lavoro dentro il container
WORKDIR /app

# Installa Angular CLI globalmente per poter usare il comando 'ng'
RUN npm install -g @angular/cli

# Copia prima i file delle dipendenze (per sfruttare la cache di Docker)
COPY package.json package-lock.json ./

# Installa le dipendenze del progetto
RUN npm install

# Copia tutto il resto del codice sorgente nel container
COPY . .

# Espone la porta 4200 (quella di default di Angular)
EXPOSE 4200

# Avvia l'applicazione
# --host 0.0.0.0 serve per rendere il sito accessibile da fuori il container
# --poll 2000 serve per far funzionare il ricaricamento automatico su alcuni sistemi (come Windows/WSL o Linux specifici)
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "2000"]
