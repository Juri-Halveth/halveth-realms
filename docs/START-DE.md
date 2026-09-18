# HALVETH Realms starten

Voraussetzungen: **Node.js 22 oder neuer**, ein aktueller Browser mit WebGL2 und ein beschreibbarer Ordner. Die 3D-Bibliothek ist im Paket enthalten. Für das Spiel sind weder `npm install` noch ein Konto nötig.

## Start und Ende unter Windows

1. Das ZIP vollständig entpacken. `START.cmd`, `server.mjs`, `public`, `shared` und `data` bleiben zusammen im Ordner `HALVETH-Realms`.
2. `START.cmd` doppelklicken. Der lokale Server startet im Hintergrund; der Browser öffnet **http://127.0.0.1:18770**.
3. Einen Gastnamen wählen und **Welt betreten** drücken.
4. Zum vollständigen Beenden **`STOP.cmd` aus demselben Ordner** öffnen. Der Hintergrundserver wird dabei beendet. Das Browserfenster anschließend schließen.

**Welt verlassen** gibt deinen Gastplatz frei. Das Schließen des Browsers beendet den Hintergrundserver ebenfalls nicht. Solange er läuft, entwickelt sich die Welt weiter. Zehn Gastplätze können gleichzeitig am selben lokalen Server teilnehmen.

Alternativ im Terminal des entpackten Ordners starten:

```sh
node server.mjs
```

Dann die lokale Adresse im Browser öffnen. Dieser Vordergrundstart lässt sich im Terminal mit **Strg+C** beenden. `node --version` zeigt die vorhandene Node-Version. Falls Windows `node` nicht kennt, muss Node.js zuerst installiert und das Terminal neu geöffnet werden.

## Unterwegs

| Eingabe | Wirkung |
| --- | --- |
| WASD oder Pfeiltasten | Laufen |
| Shift gedrückt halten | Schneller laufen |
| Spielfläche ziehen | Umsehen |
| Mausblick | Maussteuerung aktivieren; Esc gibt die Maus frei |
| Leertaste halten | Schweben |
| E bei einer nahen Person | Gespräch öffnen |
| 1 / Blüte | Einen Hain wachsen lassen |
| 2 / Funken | Licht erzeugen und nahe Neugier fördern |
| 3 / Schutz | Schützendes Licht erzeugen |
| 4 / LOVE | Einen Herzimpuls und freundliche Erinnerungen schenken |
| ? | Steuerungshilfe öffnen |

Auf Touchgeräten bewegen die Pfeile links unten deine Figur. Ziehe zum Umsehen über die freie Spielfläche. Schweben, Gespräche und die vier Zauber haben eigene Knöpfe.

Im **Weltmenü** kannst du Epochen voranschreiten lassen, Personen kennenlernen, die Quellenkarten lesen und das Rachel-Aufgabenbrett ansehen. Weltmenü und Hilfefenster halten deine eigene Bewegungssteuerung an; der laufende Server bleibt aktiv.

## Welten und Sicherungen

Im Weltmenü erzeugt ein eigener Fantasiesatz eine andere Welt. Der Wechsel funktioniert, wenn du der einzige aktive Gast bist. Die bisherige Welt wird gespeichert. Derselbe Satz wählt ihren vorhandenen Speicherstand wieder aus; bei einer noch unbekannten Welt legt er ihren Anfangszustand fest. Notiere die gewünschten Weltsätze.

**Weltstand exportieren** lädt eine JSON-Datei mit aktuellem Weltstand, verfügbarer Ereignishistorie und Prüfsummen herunter. Gastnamen und gespeicherte NPC-Erinnerungen gehören zur gemeinsamen Welt und können im Export enthalten sein. Verwende für eine später geteilte Welt passende Spielnamen.

Die regulären Speicherstände liegen in **`.local/realms/`**, die zuletzt gewählte Welt in **`.local/current.json`**. Für eine vollständige lokale Sicherung den Server beenden und den gesamten `.local`-Ordner kopieren. Zum Wiederherstellen bei beendetem Server den gesicherten Ordner wieder an dieselbe Stelle legen. Eine JSON-Datei aus dem Export hat derzeit keinen Importknopf in der Oberfläche; die Ordnersicherung ist der direkte Wiederherstellungsweg.

## Ohne Internet und optionales Sprachmodell

Die Spielwelt, Oberfläche, Rendererdateien, Quellenkarten und lokalen Figurenantworten funktionieren ohne Internet, wenn Node.js und der Browser bereits vorhanden sind. Externe Quellen werden erst beim bewussten Öffnen eines Quellenlinks benötigt.

Der normale Launcher kann ein bereits laufendes lokales Ollama mit vorhandenem `hermes3:8b` für freie Gespräche verwenden. Ohne verfügbares Modell antworten die lokalen Figurenregeln; die Oberfläche bezeichnet die tatsächliche Antwortquelle. Es wird beim Spielstart kein Modell automatisch heruntergeladen.

Für einen Start mit lokalen Figurenregeln und ohne Modellaufrufe zuerst einen bereits laufenden Server mit `STOP.cmd` beenden und dann im Terminal ausführen:

```sh
node scripts/launch.mjs --offline
```

`--offline` gilt beim Start eines neuen Servers. Es ändert keinen bereits laufenden Server. Auch ein bereits installiertes lokales Sprachmodell benötigt für seine Antworten grundsätzlich keine Internetverbindung.

## Wenn der Start stockt

- **Browser öffnet nicht:** http://127.0.0.1:18770 selbst öffnen.
- **Server startet nicht:** `.local/server.log` lesen. Bei einem Vordergrundstart steht die Meldung direkt im Terminal.
- **WebGL fehlt:** einen aktuellen Browser mit eingeschalteter Hardwarebeschleunigung verwenden. Die Oberfläche zeigt einen Startfehler, wenn die 3D-Initialisierung scheitert.
- **Der Port ist belegt:** den bereits laufenden Realms-Server weiterverwenden oder mit seinem `STOP.cmd` beenden. Ein anderes Programm auf diesem Port bleibt getrennt.
- **Gastplatz oder Sitzung abgelaufen:** wieder beitreten. Ein eigener Browserkontext kann einen weiteren Gastplatz belegen; aus inaktiven Sitzungen werden Plätze nach Ablauf wieder frei.

Dieses Paket enthält ein eigenständiges Spiel. Die frühere Morrowind-Installation und deren Spielstände werden für den Start nicht benötigt.
