# Von Realms 0.1 zur eigenständigen Desktopfassung

Diese Übersicht bindet den **Ausgangsstand 0.1.0 vom 19.09.2026, etwa 02:06 Uhr Europe/Berlin**. Parallel wird die Desktopfassung 0.2 vorbereitet. Ihr tatsächlicher Installer-, Installations- und Startstatus wird im jeweiligen Build-Ergebnis festgehalten; eine Ankündigung ersetzt diesen Nachweis nicht.

## Welche drei Produkte bereits existieren

| Spur | Tatsächlich vorhanden | Start und Integration | Grenze dieses Ausgangsstands |
| --- | --- | --- | --- |
| **HALVETH Realms 0.1.0** | Eigenständiger Node-Server, lokal mitgelieferte Three.js 0.180.0, begehbare prozedurale Welt, Oberfläche und Quellpaket | `START.cmd` startet den Server; Browser auf `http://127.0.0.1:18770`. Der HTTP-Status meldete 0.1.0. Weltzustand und Figuren werden tatsächlich gerendert. | Zu Beginn dieser Aufnahme noch Browserstart mit vorausgesetztem Node. Die eigenständige Windows-Desktopverpackung wird separat gebaut. |
| **HALVETH Morrowind Genesis 0.2.0** | Eigenes Python-/Tkinter-Launcherfenster, lokaler Begleiter, Lua-Mod, sieben lokale Grafikpakete und getrennte OpenMW-Profile | `START.cmd` beziehungsweise der Genesis-Link im Ausgabeordner öffnet `launcher.py` über Python. Begleiter auf `127.0.0.1:18765`; F8-Mod und Dateibrücke verbinden ihn mit OpenMW. Der Begleiter meldete 0.2.0, das vorhandene lokale Modell war erreichbar. | Genesis besitzt in dieser Fassung keinen eigenen kompilierten Installer. Es verwendet die bereits installierte Native-Engine. Beim Abruf war kein Spiel verbunden; historische erfolgreiche Engine-Tests sind getrennt dokumentiert. |
| **Morrowind Native Workshop 0.2.0 / OpenMW 0.51.0** | **Echte native EXEs und ein vorhandener Windows-Installer**: `Morrowind-Workshop.exe`, `engine/openmw.exe`, `engine/openmw-launcher.exe` und weitere Enginewerkzeuge | Installiert unter `%LOCALAPPDATA%/HALVETH/Morrowind-Native/0.2.0`. Zwei passende Desktopverknüpfungen führen zur Werkstatt beziehungsweise zum Startprofil. | Bestehendes lokales Morrowind-Paket mit seinen eigenen Daten und Bedingungen. Es ist keine Realms-Installation und kein Bestandteil des neuen unabhängigen Spiels. |

**Es stimmt daher nicht, dass bisher überall eine EXE fehlt.** Native Morrowind besitzt sie bereits. Genesis nutzt einen Python-Launcher für diese Engine. Realms ist ein eigenes Spiel und erhält eine eigene Desktopfassung.

Der vorhandene Installer liegt unter `%USERPROFILE%/Games/HALVETH-Morrowind-Native/dist/Morrowind-Workshop-Setup-0.2.0.exe`. Er ist **1.361.485.824 Bytes** groß. Sein frisch berechneter SHA-256 stimmt mit dem bestehenden Build-Beleg überein: `b6247dfc2fd9d9b157b81e46ee43837bd9483e9b6cb649e38b26f9852bb6a0c1`. Windows meldet `NotSigned`. Die Werkstatt-EXE enthält als PE-Dateiversion `0.0.0.0`; die Produktversion **0.2.0** ist durch Paketmanifest und Build-Beleg gebunden. Die Enginefassung **0.51.0** ist im gesonderten Engine-Beleg gebunden.

Die Desktopverknüpfung **Morrowind - HALVETH** verwendet eine durch Codex verwaltete `LocalCache/Local/HALVETH`-Ablage; **Morrowind Workshop - HALVETH** den regulären lokalen HALVETH-Pfad. Ein Pfadbestandteil namens `LocalCache` macht die dort verwendete Spielinstallation nicht zu entbehrlichen temporären Dateien.

## Was Realms 0.1 bereits trägt

Der bestehende [Build-Beleg 0.1](receipts/BUILD-RESULT-0.1.0.json) dokumentiert 19 bestandene Tests sowie grafische Prüfung in Chrome auf Desktop und bei 390/320 Pixel Breite. Geprüft wurden unter anderem eine sichtbare 3D-Welt, wieder geladene Blütenhaine, LOVE-Ereignisse und Erinnerungen, Touchbewegung, Schweben, Weltwechsel, Epochen, zwei gleichzeitig sichtbare Gäste, JSON-Export, 13 Quellenkarten und tatsächlich gekennzeichnete lokale Modellantworten.

Das ist ein **spielbarer lokaler Prototyp** mit einer ausgewählten prozeduralen Insel. Eine begrenzte lokale Gastverwaltung ist vorhanden; ein öffentlich betriebener Mehrspielerdienst, eine große gestreamte Welt und eine fertige professionelle Assetproduktion folgen daraus noch nicht.

## Produktionsmatrix

Die nächsten Abnahmen sind vorgeschlagene Entwicklungsziele. Mehrere Rollen können von derselben Person übernommen werden; hier werden Aufgaben benannt, keine bereits verpflichteten Mitarbeitenden.

| Bereich | Ausgangspunkt 0.1 | Nächster konkreter Liefergegenstand | Zuständige Rolle | Fertig, wenn … |
| --- | --- | --- | --- | --- |
| Desktopprodukt | Browserstart und separater lokaler Server | Installer, eigenes Fenster, Startmenüeintrag, sauberer Start/Stopp und eigener Benutzerdatenordner | Desktop-/Build-Entwicklung | Installation, Erststart, erneuter Start, Upgrade und Deinstallation mit erhaltbaren Weltdaten geprüft sind; Spiel ohne separat installiertes Node startet. |
| Art Direction | Eigene stilisierte Geometrien, Licht, Wasser und Scarlet-Farbwelt | Verbindliches kleines Stilblatt: Formen, Größen, Farben, Materialien, Tageslicht und lesbare Silhouetten | Art Direction | Ein Ort, eine Figur und ein Gegenstand denselben Stil in echten Spielszenen tragen. |
| Umgebungsart | Prozedurale Insel, Bauwerke und Haine | Ein sorgfältig gestaltetes Siedlungsviertel mit Wegen, Innen-/Außenräumen, wiederverwendbaren eigenen Modellen und Materialvarianten | Environment-/3D-Art | Ein zusammenhängender Rundgang konsistent aussieht, Orientierung bietet und das Performancebudget einhält. |
| Charaktere und Animation | Bewegte stilisierte Bewohner mit Rollen und Spielwerten | Eigene riggbare Figuren, Lauf-/Ruhe-/Gesprächsanimationen, Übergänge und Blickführung | Character Art, Rigging und Animation | Figuren beim Gehen, Stoppen, Drehen und Sprechen sichtbar kohärent reagieren; Quellassets und Nutzungsrechte zugeordnet sind. |
| Spielgestaltung | Erkunden, vier Zauber, Gespräche und Epochen | Ein kurzer vollständiger Spielbogen mit sichtbarem Problem, mindestens zwei Lösungswegen, Folgen und Rückmeldung | Game Design / Narrative Design | Eine neue Person ohne Entwicklerhilfe verstehen und abschließen kann, was sie tun und bewirken kann. |
| Level- und Interaktionsdesign | Näheinteraktion und einfache Kollisionen | Lesbare Annäherung, Interaktionsflächen, Hindernisse, zuverlässige Navigation und Kameraregeln | Level Design / Gameplay-Entwicklung | Wege und Interaktionen auch mit mehreren Figuren funktionieren und keine regelmäßig blockierenden Stellen bleiben. |
| Grafiktechnik und Leistung | Three.js, lokale Geometrie und Effekte | Messbare Profile für Auflösung, Schatten, Effekte, Sichtweite, Speicher und Objektmengen | Rendering-/Performance-Entwicklung | Eine festgelegte Hardware- und Szenenmatrix die vereinbarten Bildzeit- und Speicherziele über längere Läufe erreicht. |
| Audio | Visuelle Rückmeldungen und Textgespräche | Räumliche Umgebungsgeräusche, Bewegung, Magie, Lautstärkeregelung und optional lizenzierte Stimmen | Audio Design / Komposition / Voice-Pipeline | Aktionen hörbar unterscheidbar sind und dieselben Informationen zusätzlich visuell zugänglich bleiben. |
| Zugänglichkeit | Sichtbare Bedienelemente, Touchsteuerung und Hilfe | Belegbare Prüfung von Kontrast, Schriftgröße, Tastaturnavigation, frei belegbaren Tasten und reduzierter Bewegung | Accessibility / UX / QA | Die vereinbarten Bedienwege mit Tastatur, Touch und den vorgesehenen assistiven Hilfen geprüft sind. |
| Qualitätssicherung | Automatisierte Kernprüfungen und erste Browserprüfungen | Wiederholbare Szenen für Erststart, Speichern, Laden, Weltwechsel, Langlauf, Eingabegeräte und Absturzrecovery | QA / Testautomatisierung | Gefundene Blocker behoben sind und ein getesteter Releasekandidat mit klarer Geräteabdeckung vorliegt. |
| Mehrspielerbetrieb | Bis zu zehn lokale Gastplätze, gemeinsamer Serverzustand | Netzwerkbetrieb mit Wiederverbindung, Datenmigration, Lasttests, Betriebsüberwachung, Backups und Supportabläufen | Multiplayer-/Backend-Entwicklung und Betrieb | Die konkret veröffentlichte Gastzahl unter realistischen Netzbedingungen und dokumentiertem Betrieb getragen wird. |
| KI und Wissensarbeit | Lokale Persönlichkeit, optionale Ollama-Antwort, begrenzte Erinnerungen und 13 Quellenkarten | Kuratierte Dialogszenen, klare Figurenkenntnisse, messbare Antwortqualität, Kontext- und Speicherbudgets | AI-/Dialogue-Entwicklung, Redaktion und QA | Figurenrollen konsistent bleiben, Ausfälle verständlich aufgefangen werden und Kosten/Latenz zur Zielhardware passen. |
| Release und Signatur | Lokale Quellen und Prüfsummen; Native-Altinstaller nicht signiert | Gepinnter Build, saubere Upgradefolge, Herkunftsnachweise und gültige Windows-Codesignatur für auszuliefernde EXEs | Release Engineering / verantwortlicher Herausgeber | Installer und Programm signiert, Signaturen geprüft und Installations-/Upgradepfade getestet sind. |
| Rechte und Veröffentlichung | Eigener MIT-Spielcode; Three.js mit eigenem MIT-Hinweis; Quellen als Paraphrasen | Assetregister, Beitragsregeln, Lizenzhinweise, Credits und klare Beschreibung bezahlter Zusatzangebote | Produktion / Rechte- und Lizenzkoordination | Jedes ausgelieferte Asset seiner Quelle und konkreten Nutzungserlaubnis zugeordnet ist. |
| Projektführung und Support | Lokales Aufgabenbrett | Priorisierte Meilensteine, Aufwand, verantwortliche Personen, Rückmeldungen und Releaseentscheidungen | Produktion / Community- und Supportarbeit | Aufgaben angenommen, Ergebnisse abgenommen und offene Arbeit sichtbar priorisiert wird. |

Ein Installer macht das Spiel einfacher startbar. Professionelle Grafik entsteht zusätzlich durch abgestimmte Modelle, Materialien, Animationen, Licht, Kameraführung, Sound und überprüfte Leistung. Beide Arbeitspakete können parallel vorankommen.

## Empfohlene Reihenfolge

1. **Desktopfassung zuverlässig ausliefern:** Start, Stopp, Weltablage, Upgrade und Rückkehrweg.
2. **Ein hochwertiger spielbarer Ausschnitt:** eine schöne Siedlung, zwei unterscheidbare Bewohner, ein vollständiges Hilfsprojekt und alle vier Zauber mit abgestimmter Rückmeldung.
3. **Breiter testen und ausbauen:** Zugänglichkeit, längere Spielsitzungen, Geräteprofile, zusätzliche Figuren und neue Orte.
4. **Gemeinsamen öffentlichen Betrieb vorbereiten:** erst mit eigener Zielkapazität, Verbindungstests, Backups, Zuständigkeiten und Releasepflege.

## Bereinigung ohne Verlust der Welten

Der interne Bereinigungsvorschlag führt ausschließlich ausgewählte eigene Testentpackungen, synthetische Testzustände, wiederherstellbare Compiler-/Downloadkopien und Python-Bytecode auf. Er ist eine Bestandsliste; bei der Erstellung wurde nichts gelöscht.

Erhalten bleiben insbesondere Realms-Welten und Backups, Genesis-Gespräche und Spielprofile, heruntergeladene aktive Grafikpakete, die Native-Morrowind-Installation, Originalspieldaten, Spielstände, versionierte Releasepakete und Herkunftsbelege. Die Live-Server wurden für diese Bestandsaufnahme nicht beendet.

Es wurden keine externen Personen kontaktiert oder eingestellt. Die Rollenmatrix benennt den Bedarf für die nächsten Produktionsschritte.

## Ergänzung: Desktop 0.2.0 – BAU_LAEUFT

**Stand 19.09.2026 · BAU_LAEUFT.** Der Ausgangsstand 0.1 oben bleibt als historische Aufnahme erhalten. Diese Ergänzung bindet den nun vorliegenden Quell- und Konfigurationsstand von `desktop/main.cjs`, `desktop/preferences.cjs`, `electron-builder.yml`, `package.json` und der Grafik-/Pauseoberfläche. Der endgültige Installer-, Installations- und Startbeleg folgt aus dem getrennten Buildlauf.

| Bereich 0.2.0 | Im Quellstand vorbereitet | Noch getrennt abzunehmen |
| --- | --- | --- |
| Desktopprogramm | Eigenes Electron-Fenster, interne Node-Laufzeit, lokaler Server auf frei gewähltem Loopback-Port und Erkennung einer bereits laufenden Instanz | Gepackte App starten, tatsächlich sichtbare 3D-Welt und erneuten Start prüfen. |
| Windowsinstallation | NSIS für den aktuellen Benutzer, ohne Elevation, wählbarer Installationsordner, Desktop- und Startmenüverknüpfung; Name `HALVETH-Realms-Setup-0.2.0-x64.exe` | Installer erzeugen und Installation, Verknüpfungsziele und Deinstallation dieser konkreten Datei prüfen. |
| Speichern und Beenden | Fenster schließen und „Speichern und beenden“ warten auf den Speicherpfad und schließen den internen Server | Persistierten Weltstand nach erneutem Start laden und das Ende des lokalen Servers beobachten. |
| Grafik | Leicht / Ausgewogen / Detailreich; 50–125 % Auflösung, Schatten, Bildratenlimit, gemessene FPS, separates Anzeigeprofil | Änderungen in der gepackten App sowie Fortbestand nach Neustart prüfen; Hardwareabdeckung und Langläufe bleiben eigene Arbeit. |
| Pause und Anzeige | P/Esc, Pauseknopf, Hintergrundpause; F11 Vollbild, F5 Neuladen; eigene Steuerung und Rendering ruhen während Pause | Tastatur, Maus, Fokuswechsel, Menüwechsel und Fortsetzen in der Desktopfassung prüfen. |
| Weltablage und Cache | Menü öffnet echte Welt- und Protokollpfade; HTTP-Cache separat leerbar; Deinstallation soll Benutzerdaten erhalten | Cachebereinigung mit erhaltenem Weltstand prüfen; Deinstallationsverhalten an separaten Testdaten beobachten. |
| Migration | Browser-/Quellwelten und neue Desktopablage sind getrennt benannt | Eine Übernahme von 0.1 separat mit Originalerhalt, Kopierbeleg und Ladetest durchführen. |
| Veröffentlichung | Windows-x64-Ziel, Lizenzhinweise und festgelegter Dateiname | Finale Bytes, Prüfsumme und konkrete Releaseprüfung binden. Diese Fassung ist nicht codesigniert. |

Die zugehörigen Nutzeranleitungen sind [START-DE.md](START-DE.md) und [DESKTOP-INSTALL.md](DESKTOP-INSTALL.md). Ihre Menünamen und Grafikwerte wurden mit dem aktuellen Quellstand abgeglichen. `BAU_LAEUFT` wird durch diesen Abgleich nicht automatisch zu einem erfolgreichen Installationstest.

### Produktionsrollen nach der Desktopverpackung

Der eigene Installer schließt den Arbeitsschritt „zusätzliche Node-Installation und Browserstart“ für den vorgesehenen Desktopweg. Für ein umfangreiches Spiel bleiben insbesondere **Art Direction und Environment Art, Character Art/Rigging/Animation, Game-/Narrative-/Leveldesign, Audio, Accessibility und UX, QA auf einer breiteren Gerätematrix, Renderingoptimierung, Multiplayerbetrieb sowie Release Engineering und Codesignatur** erforderlich. Die konkreten Liefergegenstände und Abnahmen stehen weiterhin in der Produktionsmatrix oben.

Die neuen Grafikregler geben Kontrolle über die Renderbelastung. Sie ersetzen weder eine ausgearbeitete Assetproduktion noch gemessene Leistungsziele. Eine große professionelle Spielwelt und zugesicherte FPS werden aus dem Desktopbuild nicht abgeleitet. Diese Ergänzung weist Aufgaben zu; sie beauftragt oder kontaktiert keine externen Personen.

## Ergänzung: Desktop 0.2.0 – INSTALLIERT UND GEPRÜFT

Stand 2026-09-19T00:21:50.601Z: Der finale NSIS-Installer wurde gebaut, installiert und die App aus ihrer installierten EXE geprüft. 29 automatische Tests bestanden. WebGL, interne Desktop-Brücke, API-Gastbeitritt, LOVE, Figurenfürsorge, Speichern und Beenden bestanden im installierten Programm. Ein aktives natives Fenster meldete 60 FPS bei Limit 60; dies ist eine einzelne Stichprobe.

Desktop- und Startmenüverknüpfungen zeigen auf die installierte EXE. Zwei bestehende Welten wurden mit drei identischen Dateiprüfsummen übernommen; ihre Originale bleiben erhalten. Eine Deinstallation entfernte die Programm-EXE und ließ alle drei Save-Dateien unverändert. Neun ausgewählte temporäre Ordner wurden entfernt (20.595.893 Bytes).

Die abschließenden Werte und die Installer-Prüfsumme stehen in [BUILD-RESULT.json](../BUILD-RESULT.json). Der frühere BAU_LAEUFT-Abschnitt bleibt als zeitlich gebundener Zwischenstand erhalten. Native Menüklicks, längere Leistungsläufe, weitere Geräte und die Produktionsrollen der Matrix sind weiter offen. Der Installer ist unsigniert.
