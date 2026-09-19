# HALVETH Realms 0.2 – losspielen

Die Windows-Desktopfassung bringt ihr Spielfenster, Electron und die Node-Laufzeit mit. Für sie brauchst du weder ein separat installiertes Node.js noch einen Browser oder ein Spielkonto. Sie enthält eine eigenständige Fantasywelt; eine Morrowind-Installation wird dafür nicht benötigt.

Die Einrichtung steht in [DESKTOP-INSTALL.md](DESKTOP-INSTALL.md). Der aktuelle Build- und Prüfstand wird getrennt in [PRODUCTION-ROADMAP.md](PRODUCTION-ROADMAP.md) festgehalten.

## Start, Pause und Ende

1. **HALVETH Realms** über die Desktopverknüpfung oder das Windows-Startmenü öffnen.
2. Einen Gastnamen wählen und **Welt betreten** drücken.
3. Mit **P**, **Esc** oder dem Pauseknopf die eigene Reise unterbrechen. **Weiterreisen** setzt sie fort.
4. Zum vollständigen Beenden das Spielfenster schließen oder **Spiel → Speichern und beenden** wählen. Die App speichert den Weltstand und beendet ihren integrierten lokalen Server. Währenddessen kann kurz „Welt wird gespeichert …“ im Fenstertitel erscheinen.

Pause hält deine Bewegung und die laufende 3D-Darstellung an. Der lokale Server und andere angemeldete Gäste können weiterarbeiten. Auch ein Fensterwechsel löst die Pause aus; nach der Rückkehr setzt du die Reise bewusst fort. Ein offenes Weltmenü hält die eigene Bewegungssteuerung an.

**Welt verlassen** gibt deinen Gastplatz frei und führt zur Begrüßung zurück. Die App bleibt dabei geöffnet. **F5** beziehungsweise **Spiel → Ansicht neu laden** lädt nur die Oberfläche neu. **F11** beziehungsweise **Ansicht → Vollbild** wechselt zwischen Fenster und Vollbild.

## Unterwegs

| Eingabe | Wirkung |
| --- | --- |
| WASD oder Pfeiltasten | Laufen |
| Shift gedrückt halten | Schneller laufen |
| Freie Spielfläche ziehen | Umsehen |
| Mausblick-Knopf | Maussteuerung aktivieren; Esc gibt die Maus frei |
| Leertaste halten | Schweben |
| E bei einer nahen Person | Gespräch öffnen |
| 1 / Blüte | Einen Hain wachsen lassen |
| 2 / Funken | Licht erzeugen und nahe Neugier fördern |
| 3 / Schutz | Schützendes Licht erzeugen |
| 4 / LOVE | Einen Herzimpuls und freundliche Erinnerungen schenken |
| M | Weltmenü öffnen |
| P / Esc | Pause / weiterreisen; Esc schließt ein offenes Menü |
| F11 | Vollbild umschalten |
| F5 | Ansicht neu laden |

Der **?**-Knopf öffnet die Steuerungshilfe. Auf Touchgeräten bewegen die Pfeile links unten deine Figur. Ziehe zum Umsehen über die freie Spielfläche. Schweben, Gespräche und die vier Zauber haben eigene Knöpfe.

Im **Weltmenü** kannst du Epochen voranschreiten lassen, Personen kennenlernen, Quellenkarten lesen, das Rachel-Aufgabenbrett ansehen und die Grafik einstellen.

## Grafik passend einstellen

Öffne **Weltmenü → Grafik** oder in der Pause **Grafik & Anzeige**. Die Änderungen wirken sofort und werden als eigenes Anzeigeprofil gespeichert.

| Profil | Auflösungsskala | Schatten | Bildratenlimit |
| --- | --- | --- | --- |
| Leicht | 75 % | Aus | 30 FPS |
| Ausgewogen | 100 % | Fein, 2048 × 2048 | 60 FPS |
| Detailreich | 125 % | Sehr fein, 4096 × 4096 | 60 FPS |

Du kannst die **Auflösung von 50 bis 125 %** in Fünferschritten, die Schatten und das Limit separat ändern. Für Schatten stehen Aus, Kompakt, Fein und Sehr fein bereit; für das Bildratenlimit 30, 60, 120 FPS oder Bildschirmfrequenz. Eine kleinere Auflösungsskala reduziert die Pixelzahl der Spielwelt, während die Oberfläche scharf bleibt. Die tatsächlich verwendete Renderauflösung steht im selben Menü.

**Gemessene FPS in der Spielansicht zeigen** blendet die gemessene Bildrate ein. Das eingestellte Limit ist ein Zielmaximum; die erreichte Bildrate hängt von Gerät und Szene ab. Beginne bei stockender Darstellung mit **Leicht**. **Standard wiederherstellen** setzt das Anzeigeprofil auf Ausgewogen zurück und lässt die Welten erhalten.

## Welten, Export und Sicherung

Im Weltmenü erzeugt ein eigener Fantasiesatz eine andere Welt. Der Wechsel funktioniert, wenn du der einzige aktive Gast bist. Die bisherige Welt wird gespeichert. Derselbe Satz wählt ihren vorhandenen Speicherstand wieder aus; bei einer noch unbekannten Welt legt er ihren Anfangszustand fest. Notiere die gewünschten Weltsätze.

**Weltstand exportieren** lädt eine JSON-Datei mit aktuellem Weltstand, verfügbarer Ereignishistorie und Prüfsummen herunter. Gastnamen und gespeicherte NPC-Erinnerungen gehören zur gemeinsamen Welt und können im Export enthalten sein. Verwende passende Spielnamen, wenn du einen Export später teilen möchtest.

Den tatsächlichen Speicherort öffnest du über **Pflege → Eigene Weltstände öffnen**. Der geöffnete Weltordner enthält `realms` und die Auswahl der aktuellen Welt in `current.json`. Sein Pfad wird von der App ermittelt; du musst keinen AppData-Pfad erraten.

Für eine vollständige Sicherung:

1. Den Weltordner über das Menü öffnen und das Explorerfenster offen lassen.
2. HALVETH Realms über **Speichern und beenden** schließen.
3. Den gesamten geöffneten Weltordner an einen eigenen Sicherungsort kopieren.

Zur Wiederherstellung die App vollständig schließen und den gesicherten Weltordner am zuvor angezeigten Ort wiederherstellen. Sichere einen vorhandenen neueren Stand vorher separat. Die JSON-Ausgabe hat derzeit keinen Importknopf; für eine vollständige Rückkehr dient die Ordnersicherung.

Welten aus dem Quell-/Browserstart 0.1 liegen in einer anderen Ablage. Ihre Übernahme in die Desktopfassung ist ein eigener, dokumentierter Migrationsschritt. Eine Neuinstallation allein belegt diese Übernahme nicht.

## Ansichts-Cache und Protokolle

**Pflege → Ansichts-Cache leeren und neu laden** entfernt zwischengespeicherte Ansichtsdateien und lädt die Oberfläche neu. Die gespeicherten Welten und das Anzeigeprofil bleiben erhalten. Verwende diese Funktion bei einer veralteten Darstellung; zum Aufräumen brauchst du den Weltordner nicht zu löschen.

Bei Start- oder Darstellungsproblemen öffnet **Pflege → Start- und Fehlerprotokolle öffnen** die tatsächliche Protokollablage. Bei einem Speicherfehler meldet die App, dass der Abschluss nicht vollständig gelang; prüfe freien Speicher und Schreibzugriff, bevor du sie zwangsweise beendest.

## Ohne Internet und mit optionalem Sprachmodell

Die installierte Spielwelt, Oberfläche, 3D-Dateien, Quellenkarten und lokalen Figurenantworten funktionieren ohne Internet. Externe Quellenlinks öffnen bei bewusster Auswahl den Standardbrowser.

Ein bereits laufendes lokales Ollama mit vorhandenem `hermes3:8b` kann freie Gespräche liefern. Ohne verfügbares Modell antworten die lokalen Figurenregeln; die Oberfläche bezeichnet die tatsächliche Antwortquelle. Beim Spielstart wird kein Modell heruntergeladen. Auch ein bereits installiertes lokales Sprachmodell kann seine Antworten offline berechnen.

## Alternative für Entwicklung: Quellpaket im Browser

Nur diese Alternative benötigt **Node.js 22 oder neuer**, einen aktuellen Browser mit WebGL2 und einen beschreibbaren entpackten Projektordner. Renderer und Spieldateien sind enthalten; zum normalen Quellstart ist kein `npm install` erforderlich.

`START.cmd` startet den Hintergrundserver und öffnet `http://127.0.0.1:18770`. **`STOP.cmd` aus demselben Quellordner** speichert und beendet diesen Server. Das Schließen des Browsers allein beendet ihn nicht. Seine Daten liegen im Quellordner unter `.local`; sie sind von der Desktopablage getrennt.

Für den Vordergrundstart im Projektordner:

```sh
node server.mjs
```

Mit **Strg+C** beenden. Für einen neuen Quellserver ohne Modellaufrufe zuerst einen bereits laufenden Quellserver mit `STOP.cmd` schließen und dann starten:

```sh
node scripts/launch.mjs --offline
```

Der Schalter wirkt beim Start eines neuen Servers. Er ändert keinen schon laufenden Server. Bei Problemen dieser Entwickleralternative helfen `.local/server.log`, die Terminalausgabe und `node --version`.
