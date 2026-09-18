# HALVETH Realms 0.1 — shared implementation contract

Original procedural fantasy sandbox. Node >=22, browser ES modules, local vendored Three.js. Server defaults to 127.0.0.1:18770. All HTTP resources local; no external requests required to play. No game assets from Bethesda, Rockstar or the earlier mod are copied.

## State and rendering

`GET /api/state` returns `{worldId, seed, seedHash, epoch, revision, terrain:{size:480,seedInt}, landmarks, npcs, cultures, players, effects, recentEvents, ledgerHead}`.

Coordinates are x/z ground-plane metres centered on origin, bounded to -220..220. The browser computes y with `terrainHeight(x,z,seedInt)` imported from `/shared/world.mjs`. A player starts at `{x:0,z:36}`. Main portal/citadel at origin; three settlements around it. Landmarks `{id,name,x,z,kind:'citadel'|'village'|'grove'|'ruin',color}`. NPCs `{id,name,role,x,z,homeX,homeZ,color,culture,traits:{curiosity,care,courage},memory}`. Cultures `{id,name,color,members:[npcId],formedAt}`. Players `{id,slot,name,x,z,yaw,color,lastSeen}`. Effects `{id,kind,x,z,createdAt}` expire server-side. Recent events `{id,kind,text,epoch}`. `seedHash` and `ledgerHead` are SHA-256 hex strings. World state evolution is bounded and deterministic for the same seed and action sequence. Hashes demonstrate a bound record, not immutability of a local machine or chain consensus.

`shared/world.mjs` exports `terrainHeight(x,z,seedInt)`, `seedIntFromString(seed)`, `createWorld(seed)`, `evolveWorld(world,steps=1)`. This module is browser-compatible and deterministic; the server supplies cryptographic hashing separately.

## Requests

- `GET /api/health` → `{app,version,mode,maxGuests:10,players,worldId}`.
- `POST /api/join` `{name,slot?}` → `{token,playerId,slot,world}`. Omit slot for first free. At most ten simultaneous guest sessions; occupied explicit slot =409, capacity=409. Token only returned to joining client, never in public world snapshots. Store token only in sessionStorage. Idle sessions expire.
- `POST /api/leave` `{token}` → `{ok:true}`.
- `POST /api/action` `{token,kind:'move',x,z,yaw}` → `{ok:true,player}`. Finite values, bounded coordinates, rate/distance checks; renderer updates at about 8 Hz while moving.
- `POST /api/action` `{token,kind:'levitate',active:boolean}` → `{ok:true,player,world}`. Players expose a `levitating` flag for visual flight height; movement remains bounded server-side.
- `POST /api/action` `{token,kind:'cast',spell:'bloom'|'spark'|'ward'|'love',x,z}` → `{ok:true,event,world}`. Target near the player's position; cooldown, no raw code evaluation. Bloom grows a persistent flower grove; Spark makes a light burst and advances curiosity; Ward creates protective light. LOVE sends a friendly heart impulse and leaves a memory with nearby inhabitants. The prototype has no combat-damage system.
- `POST /api/action` `{token,kind:'evolve',steps:1|5|10}` → `{ok:true,world}`. Bounded simulated epochs, consent-based fictional guild formation from trait similarity. The running server also advances one epoch periodically; no background work after shutdown.
- `POST /api/talk` `{token,npcId,message}` → `{reply,source:'local-persona'|'ollama',npcId,event,sourceRefs}`. Message length is at most 600 characters. The server supplies the NPC persona, world facts and at most two matching curated source cards to optional local Ollama. Source references identify provided context, not verified claims in the model's answer. Explicit offline persona fallback remains available; no model-generated code or action is executed.
- `POST /api/world` `{token,seed}` → `{world}`. Creates/selects a separate seeded realm, preserving the prior world's checkpoint. A switch requires exactly one active guest; otherwise the server returns 409. Seed is a public world generation phrase, never a wallet recovery phrase. Names and seeds are displayed as text.
- `GET /api/export` → `{schema,world,events,ledgerHead,ledgerBase,checkpointHash}`; no session credentials. Exports include up to the latest 1,024 hash-linked events, with the preceding hash in `ledgerBase`.
- `GET /api/knowledge` → original, explicit curated source cards from `data/knowledge.json`.
- `GET /api/board` → Rachel-style local build board (`Neu`, `In Arbeit`, `Erledigt`).

Errors return `{error}` with meaningful 4xx/5xx. Server serves only `public/` and explicit shared source modules. State/checkpoints/events in ignored `.local/`, no shell/code tools exposed to guests. Request bodies bounded, accept JSON only; same-origin browser use. Ten guests are local prototype capacity, not a public production-service claim.

## Visual/game loop

The original island contains a scarlet citadel, warm settlement lights, turquoise water, a crystal grove, flower gardens, a changing light cycle and moving stylized adult NPCs. The renderer follows server snapshots and action responses. Controls are WASD/arrows, mouse/drag look, Shift sprint, Space levitation, E for a nearby conversation, and keys 1–4 for spells. Touch controls and clickable spells are included. The interface shows a compass, place name, conversation, epoch and community counts, sources and export tools. Opening a menu pauses local movement; the server continues world simulation. WebGL and connection failures produce visible messages.
