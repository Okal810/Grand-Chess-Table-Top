@echo off
echo Starte Grand Tabletop Chess...

:: Sicherstellen, dass alle Abhängigkeiten installiert sind
call npm install

:: Starten des Entwicklungsservers
echo Server wird gestartet. Die App ist gleich unter http://localhost:3000 erreichbar.
call npm run dev
pause
