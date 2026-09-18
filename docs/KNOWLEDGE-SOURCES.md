# Wissensquellen für HALVETH Realms

Stand des Quellenabrufs: 19. September 2026, 01:33 Uhr Europe/Berlin (18. September 2026, 23:33 UTC).

`data/knowledge.json` enthält **13 kurze Datenkarten: neun öffentliche HALVETH-/LUCINET-/Lernstudio-Quellen und vier technische Primärquellen**. Die Zusammenfassungen und Spielideen sind neu formuliert. Es wurden für diese Wissensbasis keine fremden Implementierungen, vollständigen Artikel, Lektionen, Figurendialoge, Modelle, Texturen oder sonstigen Medien übernommen.

## Tatsächlicher Umfang

Die öffentliche GitHub-API lieferte bei einer einzelnen Repository-Abfrage acht öffentliche Repositories für `Juri-Halveth`. Aus fünf davon wurden die jeweiligen README-Dateien gelesen. Vier gezielt gewählte weitere Texte stammen aus `open-research-branches`: ASTER/Secret Garden, Binary Inquiry Loop, Focus Kernel und Mitmachen. Diese neun Quellen bilden die neun Projektkarten. Zusätzlich wurden die Lizenzkarten von Scarlet und Open Research sowie die ISC-Lizenz von Mein Lernportal gelesen.

Die GitHub-Profilabfrage des verbundenen Connectors begründet keine Gleichsetzung dieses Kontos mit dem öffentlichen Herausgeber `Juri-Halveth`. Die öffentliche Zuordnung der hier genannten Repositories wurde getrennt über [GitHubs öffentlichen Repository-Endpunkt](https://api.github.com/users/Juri-Halveth/repos?per_page=100) geprüft. Jeder ausgewählte Repository-Eintrag führte `private: false`; die ausgewählten Dateien wurden danach nochmals unter dem unten gebundenen Commit gelesen.

Es gab keinen Vollscan der Repositories, keine Untersuchung privater Projekte und keinen Abruf privater Chats, Dokumente, Wallets oder Sitzungsdaten. Die drei nicht ausgewählten öffentlichen Repositories wurden nur als Metadaten im Ergebnis der Auflistung sichtbar. Ihre Inhalte bilden keine Spielkarten. Auch verlinkte historische Akten und die gesamte ältere Git-Historie wurden nicht erschlossen.

Die technischen Karten stützen sich auf die offizielle Three.js-Installationsanleitung, die OpenMW-Lua-Übersicht, die Khronos-glTF-Seite und den MIT-Lizenztext der Open Source Initiative. Die offizielle Three.js-Lizenz wurde zusätzlich geprüft. Die Three.js-Anleitung war als vollständiger Suchtreffer lesbar; ein anschließender Direktabruf durch das Webwerkzeug schlug fehl. Veraltete Fundamentals-/Creating-a-scene-Pfade lieferten keine nutzbare Quelle und wurden nicht als gelesene Grundlagen ausgegeben.

## Karten

| ID | Gelesene Quelle | Status |
| --- | --- | --- |
| `halveth-portal` | [HALVETH × LUCINET · Ein gemeinsamer Einstieg](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/3ad30e10cac511ed168e98e06ea2d0f48f9896f9/README.md) | PUBLIC_SOURCE_READ |
| `scarlet-garden` | [Scarlet · Profile, Quellen und ein Garten](https://github.com/Juri-Halveth/halveth-scarlet/blob/d2a253156c1f0d0f59eb92fb5bd5875b090ceedf/README.md) | PUBLIC_SOURCE_READ |
| `lernstudio-memory` | [Lernstudio · Fortschritt gehört zur Person](https://github.com/Juri-Halveth/lernstudio/blob/b930b09f89020b57bb91e29305b7577527a91335/README.md) | PUBLIC_SOURCE_READ |
| `lernportal-access` | [Mein Lernportal · Lernen durch Ausprobieren](https://github.com/Juri-Halveth/mein-lernportal/blob/5b46c2206ba408d70017378486cda8ea94f090b2/README.md) | PUBLIC_SOURCE_READ |
| `research-branches` | [Open Research · Kleine fortsetzbare Projekte](https://github.com/Juri-Halveth/open-research-branches/blob/978a38931535023c136b8183c8d187d1a6f60056/README.md) | PUBLIC_SOURCE_READ |
| `aster-memory-lens` | [LUCINET::ASTER · Quelle und Erinnerung auseinanderhalten](https://github.com/Juri-Halveth/open-research-branches/blob/978a38931535023c136b8183c8d187d1a6f60056/branches/aster-provenance-and-secret-garden/README.md) | PUBLIC_SOURCE_READ |
| `inquiry-dialogue` | [Binary Inquiry Loop · Eine gemeinsame Frage](https://github.com/Juri-Halveth/open-research-branches/blob/978a38931535023c136b8183c8d187d1a6f60056/branches/binary-inquiry-loop/README.md) | PUBLIC_SOURCE_READ |
| `focus-player-choice` | [Focus Kernel · Das gewählte Ziel bleibt sichtbar](https://github.com/Juri-Halveth/open-research-branches/blob/978a38931535023c136b8183c8d187d1a6f60056/branches/focus-kernel/README.md) | PUBLIC_SOURCE_READ |
| `research-contribution` | [Mitmachen · Fragen sind Beiträge](https://github.com/Juri-Halveth/open-research-branches/blob/978a38931535023c136b8183c8d187d1a6f60056/wiki/Mitmachen.md) | PUBLIC_SOURCE_READ |
| `three-local-world` | [Three.js · Eine lokal ausgelieferte 3D-Welt](https://threejs.org/manual/pages/installation.html) | OFFICIAL_SOURCE_READ |
| `openmw-records` | [OpenMW · Definition, Instanz und aktiver Ort](https://openmw.readthedocs.io/en/stable/reference/lua-scripting/overview.html) | OFFICIAL_SOURCE_READ |
| `gltf-assets` | [Khronos glTF · Austauschbare 3D-Bausteine](https://www.khronos.org/gltf/) | OFFICIAL_SOURCE_READ |
| `mit-open-source` | [MIT · Auch kommerziell verwendbarer Quellcode](https://opensource.org/license/mit) | OFFICIAL_SOURCE_READ |

`PUBLIC_SOURCE_READ` bedeutet: Die genannte öffentliche Datei wurde gelesen. `OFFICIAL_SOURCE_READ` bedeutet: Inhalt von der offiziellen Projekt- oder Herausgeberseite wurde gelesen. Diese Statuswerte bestätigen weder die vollständige historische Richtigkeit der Quellentexte noch eine laufende Integration.

`summary` beschreibt die Quelle. `designUse` ist eine eigene gestalterische Ableitung für HALVETH Realms. Eine Designidee in einer Karte ist noch kein Nachweis, dass die konkrete Spielfunktion bereits implementiert oder getestet wurde.

## Gebundene GitHub-Fassungen

| Repository | Beim Abruf verwendeter Commit |
| --- | --- |
| [halveth-scarlet](https://github.com/Juri-Halveth/halveth-scarlet/tree/d2a253156c1f0d0f59eb92fb5bd5875b090ceedf) | `d2a253156c1f0d0f59eb92fb5bd5875b090ceedf` |
| [lernstudio](https://github.com/Juri-Halveth/lernstudio/tree/b930b09f89020b57bb91e29305b7577527a91335) | `b930b09f89020b57bb91e29305b7577527a91335` |
| [mein-lernportal](https://github.com/Juri-Halveth/mein-lernportal/tree/5b46c2206ba408d70017378486cda8ea94f090b2) | `5b46c2206ba408d70017378486cda8ea94f090b2` |
| [open-research-branches](https://github.com/Juri-Halveth/open-research-branches/tree/978a38931535023c136b8183c8d187d1a6f60056) | `978a38931535023c136b8183c8d187d1a6f60056` |
| [Juri-Halveth.github.io](https://github.com/Juri-Halveth/Juri-Halveth.github.io/tree/3ad30e10cac511ed168e98e06ea2d0f48f9896f9) | `3ad30e10cac511ed168e98e06ea2d0f48f9896f9` |

Die Kartenlinks zeigen auf diese Commits. Änderungen an `main` ändern die hier gemeinte Quellfassung nicht. Git-Objektadressen binden eine Fassung; sie beweisen keine unabhängige historische Datierung oder Rechteinhaberschaft.

## Rechte und kommerzielle Verwendung

Die HALVETH-Repositories besitzen keine einheitliche pauschale MIT-Freigabe. Die gelesenen aktuellen [Scarlet-Lizenzhinweise](https://github.com/Juri-Halveth/halveth-scarlet/blob/d2a253156c1f0d0f59eb92fb5bd5875b090ceedf/LICENSES.md) ordnen neue eigene Beiträge HALVETH PIRL 2.0 zu und unterscheiden ausdrücklich Source Available von OSI-anerkanntem Open Source. Die [Lizenzkarte von Open Research](https://github.com/Juri-Halveth/open-research-branches/blob/978a38931535023c136b8183c8d187d1a6f60056/LICENSES.md) führt historische MIT-, CC-BY-, CC0- und weitere Freigaben sowie eine spätere Grenze für unterscheidbare neue Beiträge. Ein generisches MIT-Badge aus Repository-Metadaten ersetzt diese Pfad- und Versionszuordnung nicht.

[Mein Lernportal](https://github.com/Juri-Halveth/mein-lernportal/blob/5b46c2206ba408d70017378486cda8ea94f090b2/LICENSE.txt) weist originalen Plattformcode und Originallektionen ISC zu; getrennte Hinweise für Drittmaterial bleiben maßgeblich. Das aktuelle Lernstudio-README beschreibt historische ISC-Fassungen und neue Beiträge unter besonderen Bedingungen. Eine öffentliche Lesemöglichkeit ist keine automatische Erlaubnis, beliebige Inhalte oder Marken in das Spiel zu übernehmen.

Die Wissenskarten verwenden kurze eigene Paraphrasen und Verweise als gestalterische Anregung. Es wird keine globale kommerzielle Freigabe für die verlinkten Repositories oder deren Fremdmaterial behauptet. Marvel-Figuren, Bethesda-Inhalte, NASA-Bilder, Stimmen und Bildnisse sind durch diese Karten nicht zur Verwendung freigegeben. Bei einer späteren konkreten Übernahme muss die jeweilige Datei samt Version und Lizenz separat zugeordnet werden.

Für **eigenen Spielcode unter unveränderter MIT-Lizenz** gilt: Kommerzielle Nutzung und der Verkauf von Kopien sind erlaubt; Copyright- und Lizenzhinweis müssen bei Kopien oder wesentlichen Teilen mitgegeben werden. Eine verpflichtende Spende als zusätzliche Nutzungsbedingung gehört nicht zur Standard-MIT-Lizenz. Freiwillige Spenden, bezahlte Betreuung oder gesonderte Auftragsarbeiten können daneben angeboten werden. Maßgebliche Primärquelle: [Open Source Initiative – The MIT License](https://opensource.org/license/mit).

Die [Three.js-Lizenz](https://github.com/mrdoob/three.js/blob/dev/LICENSE) nennt MIT für die Bibliothek und die zugehörige Dokumentation. Das ersetzt keine Lizenzhinweise für separat gewählte 3D-Assets. glTF beschreibt ein Austauschformat; eine gebührenfreie Spezifikation macht darin gespeicherte Modelle nicht automatisch frei verwendbar. Für die OpenMW-Dokumentation wurde hier keine separate Lizenzentscheidung getroffen; die Karte enthält nur eine kurze eigene Zusammenfassung.

## Empfohlene eigene Weltrichtung

Meine gestalterische Empfehlung ist ein **leuchtender Inselgarten mit einer scharlachfarbenen Sternwarte**: klare Küsten, türkisfarbenes Wasser, warme Siedlungen und Kristallhaine. Drei gleichwertige Tätigkeiten tragen die Welt: erkunden, helfen und gemeinsam lernen. Bewohner unterscheiden sich durch Rollen, Interessen und persönliche Erinnerungen. Kleine sichtbare Folgen — ein wachsender Hain, eine beleuchtete Brücke, ein fertiggestelltes Atelier — machen Zusammenarbeit spielbar.

Die Quellen liefern dafür Ideen wie getrennte Erinnerungsräume, nachvollziehbare Beziehungen, frei erreichbare Bildung und freiwillige Vorhaben. Gestaltung, Namen der neuen Bewohner, Geometrien, Dialoge und Spielregeln werden eigenständig entwickelt. Das ist eine Designentscheidung, keine Behauptung über ein vollständig simuliertes Universum oder ein Bewusstsein der Figuren.

## Fortsetzung

Eine weitere Karte kommt hinzu, wenn eine konkrete neue Spielentscheidung eine passende öffentliche Quelle benötigt. Ein neuer Import von Code oder Medien erhält vorher eine eigene Herkunfts- und Lizenzzuordnung. Private Archive und die alte Morrowind-Installation sind keine automatische Datenquelle dieses Spiels.
