#!/bin/bash

# Dieses Skript installiert die benötigten Pakete (falls noch nicht geschehen) 
# und startet den lokalen Entwicklungsserver für Grand Tabletop Chess.

echo "Starte Grand Tabletop Chess..."

# Sicherstellen, dass alle Abhängigkeiten installiert sind
npm install

# Starten des Entwicklungsservers
echo "Server wird gestartet. Die App ist gleich unter http://localhost:3000 erreichbar."
npm run dev
