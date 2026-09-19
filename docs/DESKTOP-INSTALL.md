# HALVETH Realms 0.2.0 unter Windows installieren

Die Desktopfassung enthält ein eigenes Spielfenster und ihre Electron-/Node-Laufzeit. Ein separat installiertes Node.js, Browser oder Morrowind ist für diesen Start nicht nötig. Zielplattform dieser Fassung ist **Windows x64**.

Vorgesehene Installationsdatei: **`HALVETH-Realms-Setup-0.2.0-x64.exe`**. Der Buildstatus und die tatsächlich abgeschlossenen Prüfungen stehen in [PRODUCTION-ROADMAP.md](PRODUCTION-ROADMAP.md). Diese Anleitung beschreibt die in der Buildkonfiguration festgelegte Installation; der Dateiname allein ist kein Nachweis eines abgeschlossenen Builds.

## Installieren und öffnen

1. Die Setup-Datei aus dem zugehörigen Release öffnen.
2. Im Installationsassistenten den Zielordner für dein Windows-Benutzerkonto wählen und installieren. Die NSIS-Konfiguration sieht eine Installation für den aktuellen Benutzer ohne Administratorrechte vor.
3. **HALVETH Realms** auf dem Desktop oder im Windows-Startmenü öffnen. Der Installer legt die entsprechenden Verknüpfungen an; das Spiel startet nach Abschluss nicht automatisch.
4. Einen Gastnamen eingeben und **Welt betreten** wählen.

Die Fassung ist **nicht mit einem Windows-Codesignaturzertifikat signiert**. Windows kann deshalb einen Hinweis auf einen unbekannten Herausgeber anzeigen. Beziehe die Datei aus dem benannten Release und vergleiche bei Bedarf ihre SHA-256-Prüfsumme mit dessen Build-Beleg. Eine organisationsseitig blockierte Installation benötigt deren vorgesehenen Freigabeweg.

Die App öffnet ihren integrierten Server ausschließlich lokal und wählt einen freien Port. Die Desktopfassung benötigt daher keine manuell eingetragene Browseradresse. Erneutes Starten derselben App bringt das vorhandene Fenster nach vorne.

## Beenden, Vollbild und Grafik

Das **X** des Fensters, **Alt+F4** und **Spiel → Speichern und beenden** führen über denselben Speicher- und Beendigungspfad. Der Weltstand wird geschrieben und der integrierte Server geschlossen. Bei einem Speicherfehler zeigt die App eine Meldung.

**P / Esc** pausiert die eigene Reise, **F11** schaltet Vollbild und **F5** lädt die Ansicht neu. Pause beendet den Server nicht. Grafikprofile findest du im **Weltmenü → Grafik** oder in der Pause unter **Grafik & Anzeige**.

**Leicht**, **Ausgewogen** und **Detailreich** setzen Auflösung, Schatten und Bildratenlimit gemeinsam. Separat stehen 50–125 % Auflösung, vier Schattenstufen und 30/60/120 FPS beziehungsweise Bildschirmfrequenz bereit. Die gemessene Bildrate lässt sich einblenden. Die Profile sind Einstellungen für unterschiedliche Belastung; eine bestimmte Bildrate ist damit nicht zugesichert. Alle Steuerungsdetails stehen in [START-DE.md](START-DE.md).

## Speicherort, Sicherung und Cache

**Pflege → Eigene Weltstände öffnen** zeigt die tatsächlich verwendete Weltablage im Explorer. **Pflege → Start- und Fehlerprotokolle öffnen** zeigt die Protokollablage. Beide Pfade stammen aus der laufenden App; ein angenommener AppData-Pfad ist dafür nicht nötig.

Öffne den Weltordner vor einer Sicherung, beende danach das Spiel vollständig und kopiere den gesamten angezeigten Ordner. Die Sicherung enthält die Welten und deren Auswahl. Das Anzeigeprofil wird separat gespeichert.

**Pflege → Ansichts-Cache leeren und neu laden** bereinigt ausschließlich den HTTP-Cache der Ansicht. Es löscht weder die Welten noch das Anzeigeprofil. Eine große oder alte Ablage mit Spielständen ist kein Ansichts-Cache.

## Frühere Welten und Updates

Die Quell-/Browserfassung 0.1 und die Desktopfassung verwenden getrennte Weltablagen. Eine Übernahme alter Welten wird als eigener Schritt mit gesicherten Ausgangsdaten und Ergebnisbeleg durchgeführt. Diese Anleitung behauptet keine bereits abgeschlossene Migration.

Vor einem späteren Update das Spiel regulär schließen und eine Sicherung über den oben beschriebenen Weltordner anlegen. Ein Upgrade gilt erst nach einem mit dieser Versionsfolge geprüften Installations- und Ladetest als verifiziert.

Die Deinstallation erfolgt über Windows **Installierte Apps → HALVETH Realms → Deinstallieren**. Die vorliegende NSIS-Konfiguration erhält die Benutzerdaten bei der Deinstallation. Ein separat gewünschtes Löschen eigener Welten muss daher bewusst am zuvor angezeigten Speicherort erfolgen; Cachebereinigung und Deinstallation ersetzen diese Entscheidung nicht.

## Offline und Entwicklungsalternative

Nach Installation sind Spielwelt, Rendererdateien, Oberfläche und lokale Figurenantworten ohne Internet nutzbar. Ein bereits installiertes und laufendes lokales Sprachmodell kann optional dazukommen; die App lädt beim Start keine Modelle nach. Internet wird für bewusst geöffnete externe Quellenlinks benötigt.

Das Quellpaket bleibt eine zusätzliche Entwicklungs- und Browserroute: Node.js 22 oder neuer, `START.cmd` zum Starten und `STOP.cmd` zum Beenden. Diese Voraussetzung betrifft die Quellroute; die Windows-Desktopfassung bündelt ihre Laufzeit. Die genaue Alternative ist am Ende von [START-DE.md](START-DE.md) beschrieben.
