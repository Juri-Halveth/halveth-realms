# HALVETH Realms · Scarlet Garden

An original procedural fantasy sandbox: a scarlet observatory, luminous groves, settlements and cosmic ruins. Explore, levitate, grow a grove, meet the inhabitants and watch new communities form. The first playable edition is a small stylized world, built as a foundation for a larger independent game.

**Own code: MIT. Commercial use is permitted under the license.** Three.js retains its separate MIT notice. The project contains no Morrowind/GTA assets and does not require either game.

## Windows desktop edition (0.2.0)

Install **HALVETH-Realms-Setup-0.2.0-x64.exe** from the [release page](https://github.com/Juri-Halveth/halveth-realms/releases). Start **HALVETH Realms** from the desktop or Start menu. The application includes its rendering and server runtime; it needs no separately installed Node.js, browser, terminal or batch launcher. Closing the application saves the current world and stops its local server.

This is an Electron application: the original JavaScript/WebGL game, local simulation server and interface are packaged together in `app.asar`, with Chromium and Node.js included. It is an installable desktop prototype, not a rewritten C++ engine or a Morrowind replacement. The installer is currently unsigned and supports Windows x64.

Graphics presets, resolution scale, shadow quality and an FPS limit are available in the game. **P** pauses your controls and rendering; simulation continues while the application runs. **F11** toggles fullscreen. Graphics preferences and world saves are stored separately from the browser cache. Use the application menu to open the save folder or clear its HTTP cache. [Deutsche Anleitung](docs/START-DE.md) · [Desktop details](docs/DESKTOP-INSTALL.md).

## Run from source / browser edition

Requirements: Node.js 22 or later and a current browser with WebGL2. Chrome is supported. The rendering library ships locally; no npm install, account or external service is required to play.

Developers can use **START.cmd** on Windows, or run:

```sh
node scripts/launch.mjs
```

Open **http://127.0.0.1:18770**. Enter a guest name and join the world. There are ten simultaneous local guest sessions. Other browser sessions connected to this same server see the shared player positions and world changes. This is prototype shared-world functionality, not a claim of a deployed public MMO.

Controls: WASD/arrows to move, drag the view or use mouse-look, Shift to run, Space to levitate, E to speak to a nearby inhabitant, and 1–4 to cast Bloom, Spark, Ward and LOVE. Buttons provide the same actions. See the in-game help for touch controls. [Deutsche Startanleitung](docs/START-DE.md).

The launcher keeps the world server running after the browser closes. **STOP.cmd** saves the current world and stops this project's server. Start it again with START.cmd; guest sessions are recreated while saved world changes remain.

## Living world

- A world phrase reproduces the starting terrain, inhabitants and places. It is a public world seed, **not a wallet recovery phrase**.
- Bloom grows a persistent flower grove. Spark creates light and increases nearby curiosity. Ward creates protective light. LOVE creates a heart impulse and a friendly memory for nearby inhabitants. The current prototype has no combat-damage system.
- People have names, occupations, interests, individual memories and voluntary community membership. Epochs move inhabitants and let communities form around shared interests. Spark increases nearby curiosity. These are explicit game algorithms.
- The running server advances the world every 15 seconds; the world menu can advance a bounded number of epochs. Stopping the server stops simulation.
- World changes and NPC conversations belong to the shared local world. Exports contain that world history. Keep personal information out of a world you plan to share.
- When you are the only active guest, another phrase selects a separate world. Earlier realms are checkpointed and can be re-entered using the same phrase.

## NPC dialogue

The launcher detects an already running local Ollama installation with `hermes3:8b` and can use it for free-form dialogue. Otherwise, explicit local persona replies work without a model. The interface labels the response source. At most two relevant local knowledge cards accompany the persona and recent memories. The API identifies these cards as provided context, not verified citations in generated dialogue. Model text cannot execute game code or change files.

To start with a chosen local model:

```powershell
$env:REALMS_OLLAMA='1'
$env:REALMS_OLLAMA_MODEL='hermes3:8b'
node server.mjs
```

`node scripts/launch.mjs --offline` starts without model calls when starting a new server. This flag does not reconfigure an already running server. Both modes work without an internet connection once Node is installed.

## Open source and development

```sh
npm test
npm run evolve -- "Scarlet Morgenlicht"
npm run release
```

To develop or package the desktop application (network required for the first dependency/runtime download):

```sh
npm ci
npm run desktop:runtime
npm run icons
npm run desktop
npm run desktop:build
```

The Windows installer is written to `releases/desktop/`. The source ZIP is a separate download intended for development; it excludes player worlds and installed dependencies. The original vector icon and reproducible multi-size Windows icon are in `assets/`.

The content generator creates deterministic **proposals** under `.local/proposals/`. It does not silently change live worlds or rewrite source code. The prepared GitHub workflow runs tests and packages source; a second workflow can generate reviewable proposals daily at 03:17 UTC or on demand after publication and activation. GitHub itself requires connectivity.

The local Rachel-style board uses **Neu** for planned work, **In Arbeit** for active implementation and **Erledigt** for delivered functionality. Public hosting, production art and a complete commercial game remain separate roadmap items.

`data/knowledge.json` contains 13 curated source cards, including public HALVETH/LUCINET project ideas. These are original short summaries and design references. They are not a copy of all GitHub repositories or the web. [Source scope](docs/KNOWLEDGE-SOURCES.md).

## World records and optional blockchain

Each checkpoint has a SHA-256 digest; recent events form a hash-linked history. Hashes make changes detectable relative to a trusted reference. They do not make a local disk immutable, prove who played, or create blockchain consensus. The server remains authoritative for the current game simulation.

The optional [checkpoint anchor](docs/BLOCKCHAIN.md) is separate from play. It prepares an **unsent** anchor intent for a supplied network and contract address. No wallet is connected, no private key is collected and no transaction or contract is deployed automatically.

## Files and recovery

- `public/`: original scene renderer and interface; licensed Three.js under `vendor/`.
- `shared/world.mjs`: reproducible terrain and community simulation.
- `server.mjs`: ten local sessions, actions, persistence and optional dialogue.
- `desktop/`: packaged window, integrated server lifecycle, menus and display preferences.
- Desktop saves: open **Pflege → Eigene Weltstände öffnen** to locate the application-owned `worlds/` directory.
- `.local/realms/`: checkpoints of played worlds; `.local/` is excluded from Git and releases.
- `data/`: explicit public source cards and local project board.
- `chain/`: optional checkpoint contract, independent of game access.

For the source/browser edition, back up `.local/`; for the installed application, close it and back up the folder shown by its save-folder menu. Do not copy player data into a public repository. The original Morrowind installation and its Genesis mod remain separate projects.

See [commercial direction](docs/COMMERCIAL.md), [contribution guide](CONTRIBUTING.md), [API contract](API-CONTRACT.md) and [build result](BUILD-RESULT.json).
