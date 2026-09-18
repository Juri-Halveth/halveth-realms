import * as THREE from '/vendor/three.module.js';
import { terrainHeight } from '/shared/world.mjs';

const $ = id => document.getElementById(id);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const TAU = Math.PI * 2;
const sessionKey = 'halveth-realms-session';
let world, session, renderer, scene, camera, environment, ocean, portal, sun, skyLight;
let yaw = 0, pitch = -.04, altitude = 0, flight = false, flightBusy = false, desiredFlight = false, lastFlightSent = 0, flightTimer;
let player = { x: 0, z: 36 }, lastFrame = 0, elapsed = 0, lastMoveSent = 0, lastMapUI = 0;
let movePromise = null, confirmedPlayer = { x: 0, z: 36 }, lastMoveError = 0, castBusy = false, nearest, selectedNPC, dragging = false, lastTouch, worldSerial = '';
let npcModels = new Map(), guestModels = new Map(), effectModels = new Map(), cultureModels = new Map();
const landmarkModels = new Set();
let colliders = [], fireflies = [], birds, touchFlight = false, toastTimer;
const held = new Set();
const npcMessages = new Map();
const panel = $('side-panel'), help = $('help-panel');
const v = new THREE.Vector3(), dummy = new THREE.Object3D();
const materials = {};

function textNode(tag, text, className) { const e = document.createElement(tag); e.textContent = text; if (className) e.className = className; return e; }
function toast(message, duration = 4200) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, duration); }
async function api(path, body) {
  const headers = {}; if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json(); if (!res.ok) { const error = new Error(data.error || `Anfrage fehlgeschlagen (${res.status}).`); error.status = res.status; throw error; } return data;
}
async function action(kind, fields = {}) { if (!session) throw new Error('Betritt zuerst die Welt.'); return api('/api/action', { token: session.token, kind, ...fields }); }
function height(x, z) { return terrainHeight(x, z, world.terrain.seedInt); }
function rng(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function landmarkRandom(landmark) { return rng(world.terrain.seedInt + landmark.id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)); }
function mat(color, options = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .82, ...options }); }
function mesh(geometry, material, parent, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
function box(parent, x, y, z, w, h, d, material) { return mesh(new THREE.BoxGeometry(w, h, d), material, parent, x, y, z); }
function cone(parent, x, y, z, radius, h, material, sides = 7) { return mesh(new THREE.ConeGeometry(radius, h, sides), material, parent, x, y, z); }
function cylinder(parent, x, y, z, top, bottom, h, material, sides = 12) { return mesh(new THREE.CylinderGeometry(top, bottom, h, sides), material, parent, x, y, z); }
function nameSprite(name, role = '') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 120; const ctx = c.getContext('2d');
  ctx.textAlign = 'center'; ctx.shadowColor = '#0b1721'; ctx.shadowBlur = 12; ctx.font = '500 36px Georgia'; ctx.fillStyle = '#fff5dc'; ctx.fillText(name, 256, 46);
  if (role) { ctx.font = '20px Segoe UI'; ctx.fillStyle = '#bdd2cb'; ctx.fillText(role, 256, 78); }
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })); sprite.scale.set(5.5, 1.3, 1); return sprite;
}
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.12, 'rgba(255,255,255,.8)'); g.addColorStop(.4, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
const lightTexture = glowTexture();
function glow(parent, x, y, z, color, size = 2) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: lightTexture, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(x, y, z); s.scale.setScalar(size); parent.add(s); return s; }

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-label', '3D-Spielwelt. Zum Umsehen ziehen.'); renderer.domElement.tabIndex = 0; $('scene').append(renderer.domElement);
  scene = new THREE.Scene(); scene.background = new THREE.Color('#c5d8d8'); scene.fog = new THREE.FogExp2('#b6cdce', .0035);
  camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, .1, 750); camera.rotation.order = 'YXZ';
  skyLight = new THREE.HemisphereLight('#c6eaff', '#66765b', 2.2); scene.add(skyLight);
  sun = new THREE.DirectionalLight('#ffe3ac', 3.0); sun.position.set(-60, 110, 55); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 300 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .08; scene.add(sun); scene.add(sun.target);
  const ambient = new THREE.AmbientLight('#beceff', .22); scene.add(ambient);
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); toast('Die 3D-Verbindung wurde unterbrochen. Lade die Seite neu.', 20000); });
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  setupLook();
}

function disposeGroup(group) { if (!group) return; group.traverse(o => { o.geometry?.dispose(); if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) { if (m.map && m.map !== lightTexture) m.map.dispose(); m.dispose(); } }); scene.remove(group); }
function disposeDynamic(group) { const shared = new Set(Object.values(materials)); group.traverse(o => { o.geometry?.dispose(); if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (!shared.has(m)) { if (m.map && m.map !== lightTexture) m.map.dispose(); m.dispose(); } }); environment.remove(group); }
function buildWorld() {
  disposeGroup(environment); environment = new THREE.Group(); scene.add(environment); npcModels.clear(); guestModels.clear(); effectModels.clear(); cultureModels.clear(); landmarkModels.clear(); colliders = []; fireflies = [];
  Object.assign(materials, { stone: mat('#d8cab0'), pale: mat('#eee4c9'), darkStone: mat('#66797d'), roof: mat('#853249'), scarlet: mat('#bc4b63'), gold: mat('#c8a36a', { metalness: .5, roughness: .36 }), wood: mat('#6b5746'), leaf: mat('#719984'), light: mat('#ffdda0', { emissive: '#ffb64b', emissiveIntensity: 2.4 }), crystal: mat('#aedfd9', { metalness: .18, roughness: .18, emissive: '#367a75', emissiveIntensity: .6 }) });
  const random = rng(world.terrain.seedInt);
  const terrain = new THREE.PlaneGeometry(480, 480, 144, 144); terrain.rotateX(-Math.PI / 2);
  const positions = terrain.attributes.position, colors = new Float32Array(positions.count * 3), color = new THREE.Color();
  const sand = new THREE.Color('#c1c4a5'), meadow = new THREE.Color('#7e9b7d'), grass = new THREE.Color('#56786a'), rock = new THREE.Color('#a1b2a1');
  for (let i = 0; i < positions.count; i++) { const x = positions.getX(i), z = positions.getZ(i), y = height(x, z); positions.setY(i, y); const noise = .5 + Math.sin(x * .21) * Math.cos(z * .19) * .24; color.copy(y < 2 ? sand : meadow).lerp(y > 11 ? rock : grass, noise * .4); colors.set([color.r, color.g, color.b], i * 3); }
  terrain.setAttribute('color', new THREE.BufferAttribute(colors, 3)); terrain.computeVertexNormals(); mesh(terrain, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), environment).castShadow = false;
  ocean = mesh(new THREE.PlaneGeometry(900, 900, 1, 1), new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, daylight: { value: 1 } }, vertexShader: 'varying vec3 wp; void main(){vec4 p=modelMatrix*vec4(position,1.0);wp=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}', fragmentShader: 'uniform float time;uniform float daylight;varying vec3 wp;void main(){float w=sin(wp.x*.16+time*.5)*sin(wp.z*.2-time*.4);float s=pow(max(0.,sin(wp.x*.37+wp.z*.41+time*.6)),22.)*.2;vec3 a=vec3(.09,.38,.40);vec3 b=vec3(.30,.67,.65);vec3 col=mix(a,b,.48+w*.09)+s;col*=.48+daylight*.52;gl_FragColor=vec4(col,1.);}' }), environment, 0, .05, 0); ocean.rotation.x = -Math.PI / 2; ocean.castShadow = false;
  addPaths();
  for (const landmark of world.landmarks) buildLandmark(landmark, landmarkRandom(landmark));
  addNature(random); addSky(random);
  for (const npc of world.npcs) addNPC(npc);
  worldSerial = world.worldId || String(world.terrain.seedInt);
  updateDynamicWorld();
}

function addPaths() {
  const pathMaterial = mat('#c5bfa2', { roughness: 1 });
  for (const l of world.landmarks.filter(l => l.kind !== 'citadel' && !l.id.startsWith('grown-'))) {
    const coords = [], indices = [], count = 42;
    for (let i = 0; i <= count; i++) { const t = i / count, sway = Math.sin(t * Math.PI) * 10; const x = l.x * t + sway, z = l.z * t; const direction = Math.atan2(l.x, l.z), w = 1.6; for (const sign of [-1, 1]) { const px = x + Math.cos(direction) * w * sign, pz = z - Math.sin(direction) * w * sign; coords.push(px, height(px, pz) + .035, pz); } if (i < count) { const j = i * 2; indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3)); g.setIndex(indices); g.computeVertexNormals(); mesh(g, pathMaterial, environment).castShadow = false;
  }
}
function buildLandmark(l, random) {
  landmarkModels.add(l.id);
  const g = new THREE.Group(); g.position.set(l.x, height(l.x, l.z), l.z); environment.add(g);
  if (l.kind === 'citadel') {
    cylinder(g, 0, .15, 0, 16, 17, .5, materials.pale, 12);
    for (let i = 0; i < 7; i++) box(g, 0, -.7 + i * .12, 13 + i * 1.1, 12, .25, 2.2, materials.stone);
    for (const side of [-1, 1]) {
      box(g, side * 11, 5.5, -2, 5, 11, 15, materials.stone); box(g, side * 11, 10.5, -2, 5.6, .5, 15.6, materials.gold);
      for (const z of [-9, 5]) { cylinder(g, side * 11, 8, z, 3.1, 3.7, 16, materials.pale, 8); cone(g, side * 11, 19, z, 4.1, 8, materials.roof, 8); cylinder(g, side * 11, 15.7, z, 3.4, 3.4, .6, materials.gold, 8); box(g, side * 11, 10, z + 3.14, .8, 3.2, .15, materials.light); colliders.push({ x: l.x + side * 11, z: l.z + z, radius: 3.5, top: 18 }); }
      box(g, side * 6, 8, -10, 2, 16, 2, materials.stone); const flag = box(g, side * 6, 9, -8.9, 1.45, 6, .08, materials.scarlet); flag.rotation.z = side * .015;
    }
    box(g, 0, 6, -13, 17, 12, 4, materials.stone); box(g, 0, 12, -13, 18, .5, 5, materials.gold); cylinder(g, 0, 16, -15, 4.4, 5.1, 23, materials.pale, 8); cone(g, 0, 32, -15, 5.7, 11, materials.roof, 8);
    box(g, 0, 20, -9.86, 1.7, 5, .16, materials.light); glow(g, 0, 20, -9.5, '#ffc083', 7);
    const ring = mesh(new THREE.TorusGeometry(5.2, .28, 12, 80), materials.gold, g, 0, 6.6, 5.2);
    const outer = mesh(new THREE.TorusGeometry(5.8, .12, 6, 80), materials.scarlet, g, 0, 6.6, 5.15); outer.rotation.z = .13;
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; mesh(new THREE.OctahedronGeometry(.28), materials.light, g, Math.sin(a) * 5.8, 6.6 + Math.cos(a) * 5.8, 5.2); }
    portal = mesh(new THREE.CircleGeometry(4.95, 80), new THREE.ShaderMaterial({ uniforms: { time: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: 'varying vec2 uvp;void main(){uvp=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying vec2 uvp;uniform float time;void main(){vec2 p=uvp-.5;float r=length(p)*2.;float a=atan(p.y,p.x);float wave=sin(r*25.-time*1.3+a*3.)*.5+.5;vec3 c=mix(vec3(.15,.22,.36),vec3(.95,.24,.39),pow(r,2.));c+=vec3(.20,.32,.36)*wave*.3;float star=pow(max(0.,sin(a*8.+time*.3)),20.)*.15;gl_FragColor=vec4(c+star,.77-smoothstep(.87,1.,r)*.25);}' }), g, 0, 6.6, 5.2); portal.castShadow = false;
    glow(g, 0, 6.6, 5.5, '#ed6c91', 17); const light = new THREE.PointLight('#ff7091', 25, 24, 2); light.position.set(0, 7, 8); g.add(light);
    for (const x of [-7, 7]) { cylinder(g, x, 1.7, 13, .18, .35, 3.4, materials.gold); glow(g, x, 3.6, 13, '#ffbe6b', 2.5); }
  } else if (l.kind === 'village') {
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .15; const x = Math.cos(a) * 13, z = Math.sin(a) * 13, y = height(l.x + x, l.z + z) - g.position.y; const h = new THREE.Group(); h.position.set(x, y, z); h.rotation.y = -a + Math.PI / 2; g.add(h); box(h, 0, 2, 0, 5, 4, 5, i % 2 ? materials.stone : materials.pale); const roof = cone(h, 0, 5.3, 0, 4.5, 3.2, i % 2 ? materials.roof : materials.darkStone, 4); roof.rotation.y = Math.PI / 4; box(h, 0, 1.3, 2.53, 1.2, 2.6, .12, materials.wood); for (const wx of [-1.55, 1.55]) box(h, wx, 2.2, 2.56, .6, 1.05, .12, materials.light); cylinder(h, 2, 6.0, -1, .35, .5, 3, materials.stone, 6); glow(h, 0, 2.4, 3, '#ffd28b', 3.6); colliders.push({ x: l.x + x, z: l.z + z, radius: 3.0, top: 6 }); }
    cylinder(g, 0, .4, 0, 4, 4.3, .8, materials.pale); cylinder(g, 0, 1.7, 0, .5, 1, 2.2, materials.stone); mesh(new THREE.OctahedronGeometry(1.2), materials.crystal, g, 0, 3.6, 0); glow(g, 0, 3.6, 0, l.color, 5);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; const x = Math.cos(a) * 20, z = Math.sin(a) * 20, y = height(l.x + x, l.z + z) - g.position.y; cylinder(g, x, y + 1.8, z, .09, .13, 3.6, materials.wood, 5); glow(g, x, y + 3.8, z, '#ffce82', 1.8); }
  } else if (l.kind === 'grove') {
    if (l.id.startsWith('grown-')) {
      // Small, walkable gardens preserve the view through the citadel courtyard.
      const count = 28, stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(.025, .04, 1, 4), materials.leaf, count);
      const petals = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), mat('#ffffff'), count * 5);
      const centers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.075), materials.gold, count);
      const blossomColors = ['#ead8c0', '#d986a5', '#f1b8c3', '#b5cdb1'];
      for (let i = 0; i < count; i++) {
        const a = random() * TAU, r = Math.sqrt(random()) * 4.8, x = Math.cos(a) * r, z = Math.sin(a) * r;
        const y = height(l.x + x, l.z + z) - g.position.y, h = .5 + random() * .55;
        dummy.position.set(x, y + h / 2, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, h, 1); dummy.updateMatrix(); stems.setMatrixAt(i, dummy.matrix);
        dummy.position.set(x, y + h + .02, z); dummy.scale.set(1, .6, 1); dummy.updateMatrix(); centers.setMatrixAt(i, dummy.matrix);
        const color = new THREE.Color(blossomColors[i % blossomColors.length]);
        for (let p = 0; p < 5; p++) { const angle = p / 5 * TAU + a; dummy.position.set(x + Math.cos(angle) * .15, y + h, z + Math.sin(angle) * .15); dummy.rotation.set(0, -angle, 0); dummy.scale.set(.19, .055, .10); dummy.updateMatrix(); petals.setMatrixAt(i * 5 + p, dummy.matrix); petals.setColorAt(i * 5 + p, color); }
      }
      petals.castShadow = true; g.add(stems, petals, centers);
      const treeCount = 1 + Math.floor(random() * 3), start = random() * TAU;
      for (let i = 0; i < treeCount; i++) { const a = start + i / treeCount * TAU, r = 3.4 + random() * .6, x = Math.cos(a) * r, z = Math.sin(a) * r, y = height(l.x + x, l.z + z) - g.position.y, h = 3 + random(); cylinder(g, x, y + (h - .9) / 2, z, .09, .16, h - .9, materials.wood, 6); const crown = mesh(new THREE.IcosahedronGeometry(1, 1), materials.leaf, g, x, y + h - .75, z); crown.scale.set(1.1, .75, 1.1); const blossom = mesh(new THREE.IcosahedronGeometry(.58), mat('#d9aeb7'), g, x - .32, y + h - .60, z + .35); blossom.scale.set(1, .68, 1); }
    } else {
      for (let i = 0; i < 15; i++) { const a = random() * TAU, r = 2 + random() * 15, x = Math.cos(a) * r, z = Math.sin(a) * r; const y = height(l.x + x, l.z + z) - g.position.y; const crystal = cone(g, x, y + 1.8, z, .6 + random() * .6, 3 + random() * 4, materials.crystal, 5); crystal.rotation.z = (random() - .5) * .35; glow(g, x, y + 2, z, '#98e9bc', 4); }
    }
  } else if (l.kind === 'ruin') {
    cylinder(g, 0, .4, 0, 13, 13.5, .8, materials.darkStone, 12);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, h = 4 + random() * 7; const x = Math.sin(a) * 10, z = Math.cos(a) * 10; cylinder(g, x, h / 2, z, .8, 1.2, h, materials.stone, 6); box(g, x, h + .15, z, 2.2, .5, 2.2, materials.gold); }
    const orbit = mesh(new THREE.TorusGeometry(4, .1, 6, 72), materials.gold, g, 0, 7, 0); orbit.rotation.x = .8; orbit.rotation.y = .4; const orbit2 = mesh(new THREE.TorusGeometry(5, .09, 6, 72), materials.crystal, g, 0, 7, 0); orbit2.rotation.x = -.7; orbit2.rotation.y = -.4; const core = mesh(new THREE.IcosahedronGeometry(1.5), mat('#b4a0d8', { emissive: '#73599d', emissiveIntensity: .9, metalness: .4, roughness: .2 }), g, 0, 7, 0); fireflies.push({ object: core, kind: 'crystal', baseY: 7 }); glow(g, 0, 7, 0, '#baa0ed', 10);
  }
}

function addNature(random) {
  const trees = [];
  for (let i = 0; i < 500; i++) { const x = (random() - .5) * 395, z = (random() - .5) * 395, y = height(x, z); if (y < 2.0 || world.landmarks.some(l => Math.hypot(x - l.x, z - l.z) < (l.kind === 'village' ? 27 : 24)) || Math.hypot(x, z - 32) < 12) continue; trees.push({ x, y, z, scale: .7 + random() * .8, rotation: random() * TAU }); if (trees.length >= 180) break; }
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .35, 4, 5), materials.wood, trees.length);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.7, 0), materials.leaf, trees.length * 2); let ci = 0;
  trees.forEach((t, i) => { dummy.position.set(t.x, t.y + 2 * t.scale, t.z); dummy.scale.set(t.scale, t.scale, t.scale); dummy.rotation.set(0, t.rotation, 0); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix); for (let j = 0; j < 2; j++) { dummy.position.set(t.x + (j ? .9 : -.4) * t.scale, t.y + (j ? 6.3 : 4.6) * t.scale, t.z); dummy.scale.set(t.scale * (j ? .85 : 1), t.scale * 1.2, t.scale); dummy.updateMatrix(); crowns.setMatrixAt(ci, dummy.matrix); crowns.setColorAt(ci++, new THREE.Color().setHSL(.29 + random() * .1, .18 + random() * .12, .32 + random() * .1)); } });
  trunks.castShadow = true; crowns.castShadow = true; crowns.receiveShadow = true; environment.add(trunks, crowns);
  const rockCount = 100, rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), materials.darkStone, rockCount);
  for (let i = 0; i < rockCount; i++) { const a = random() * TAU, r = 80 + random() * 120, x = Math.cos(a) * r, z = Math.sin(a) * r; dummy.position.set(x, height(x, z) + .3, z); dummy.rotation.set(random(), random(), random()); dummy.scale.set(1 + random() * 3, 1 + random() * 3, 1 + random() * 3); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix); } rocks.castShadow = true; rocks.receiveShadow = true; environment.add(rocks);
  const grassCount = 1200, grasses = new THREE.InstancedMesh(new THREE.ConeGeometry(.22, .8, 3), mat('#a8bba0'), grassCount);
  for (let i = 0; i < grassCount; i++) { const x = (random() - .5) * 340, z = (random() - .5) * 340, y = height(x, z); const s = y < 1 ? 0 : .4 + random(); dummy.position.set(x, y + .3, z); dummy.rotation.set(0, random() * TAU, .2); dummy.scale.set(s, s, s); dummy.updateMatrix(); grasses.setMatrixAt(i, dummy.matrix); } environment.add(grasses);
  for (let i = 0; i < 25; i++) { const x = -48 + (random() - .5) * 35, z = -40 + (random() - .5) * 35, y = height(x, z) + 1 + random() * 5; const s = glow(environment, x, y, z, '#f9e7a4', .25 + random() * .4); fireflies.push({ object: s, kind: 'fly', baseY: y, phase: random() * TAU }); }
}
function addSky(random) {
  const vertices = []; for (let i = 0; i < 650; i++) { const a = random() * TAU, h = .1 + random() * .85, r = Math.sqrt(1 - h * h) * 330; vertices.push(Math.cos(a) * r, h * 330, Math.sin(a) * r); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#e8ecea', size: .9, transparent: true, opacity: .2, depthWrite: false })); stars.name = 'stars'; environment.add(stars);
  const moon = mesh(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: '#e0d4d8' }), environment, -125, 130, -245); moon.castShadow = false;
  birds = new THREE.Group(); environment.add(birds); for (let i = 0; i < 9; i++) { const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([-.7, 0, 0, 0, .15, .3, .7, 0, 0], 3)); mesh(wing, new THREE.MeshBasicMaterial({ color: '#43565d', side: THREE.DoubleSide }), birds, i * 2, Math.sin(i) * 2, Math.cos(i) * 3); }
}

function personModel(person, guest = false) {
  const g = new THREE.Group(), cloth = mat(person.color || '#9baad2'), skin = mat(guest ? '#bfa790' : ['#d5aa85', '#8a6050', '#b58366', '#d7bb98'][Number(person.id.replace(/\D/g, '')) % 4]);
  cone(g, 0, .92, 0, .52, 1.55, cloth, 8); cylinder(g, 0, 1.67, 0, .39, .30, .83, cloth, 8);
  mesh(new THREE.SphereGeometry(.27, 12, 10), skin, g, 0, 2.25, 0);
  const hair = mesh(new THREE.SphereGeometry(.282, 12, 8, 0, TAU, 0, Math.PI * .54), materials.wood, g, 0, 2.31, 0); hair.rotation.x = -.16;
  for (const side of [-1, 1]) { const arm = cylinder(g, side * .44, 1.54, 0, .12, .1, .8, cloth, 6); arm.rotation.z = side * .18; }
  box(g, 0, 1.45, .35, .35, .08, .06, materials.gold);
  const label = nameSprite(person.name, guest ? 'Mitreisend' : person.role); label.position.y = 3.2; g.add(label); g.userData.label = label;
  return g;
}
function addNPC(npc) { const object = personModel(npc); object.position.set(npc.x, height(npc.x, npc.z), npc.z); environment.add(object); npcModels.set(npc.id, { object, target: npc }); }
function effectTime(effect) { const t = typeof effect.createdAt === 'number' ? effect.createdAt : Date.parse(effect.createdAt); return Number.isFinite(t) ? t : Date.now(); }
function addEffect(effect) {
  const g = new THREE.Group(); g.position.set(effect.x, height(effect.x, effect.z), effect.z); const kind = effect.kind.replace('cast-', '').replace('cast:', ''); const c = kind === 'bloom' ? '#a6e6b4' : kind === 'ward' ? '#a9dce8' : kind === 'love' ? '#eab2c2' : '#ffd4a0';
  const hearts = [], pulses = [];
  if (kind === 'bloom') { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, x = Math.cos(a) * (1 + i * .18), z = Math.sin(a) * (1 + i * .18); cylinder(g, x, .7, z, .04, .09, 1.4, materials.leaf, 5); mesh(new THREE.IcosahedronGeometry(.48), mat(i % 2 ? '#eed0a1' : '#d59aaf'), g, x, 1.5, z); } }
  if (kind === 'ward') { const m = mesh(new THREE.SphereGeometry(3, 24, 16), new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: .12, depthWrite: false }), g, 0, 1, 0); m.castShadow = false; }
  if (kind === 'love') {
    const shape = new THREE.Shape(); shape.moveTo(0, -.42); shape.bezierCurveTo(-.15, -.27, -.50, -.05, -.50, .16); shape.bezierCurveTo(-.50, .49, -.12, .51, 0, .24); shape.bezierCurveTo(.12, .51, .50, .49, .50, .16); shape.bezierCurveTo(.50, -.05, .15, -.27, 0, -.42);
    const geometry = new THREE.ShapeGeometry(shape, 12);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, radius = .8 + i % 3 * .35; const h = mesh(geometry, new THREE.MeshBasicMaterial({ color: i % 3 ? '#f0a7bd' : '#f8d49d', side: THREE.DoubleSide, transparent: true, opacity: .9, depthWrite: false }), g, Math.cos(a) * radius, .9 + (i % 3) * .45, Math.sin(a) * radius); h.castShadow = false; h.scale.setScalar(.38 + i % 3 * .09); hearts.push({ object: h, x: h.position.x, y: h.position.y, z: h.position.z, phase: a }); }
    for (let i = 0; i < 2; i++) { const ring = mesh(new THREE.RingGeometry(.85, 1, 48), new THREE.MeshBasicMaterial({ color: i ? '#f5cd9b' : '#eeb3c6', side: THREE.DoubleSide, transparent: true, opacity: .28, depthWrite: false }), g, 0, .12 + i * .015, 0); ring.rotation.x = -Math.PI / 2; ring.castShadow = false; pulses.push(ring); }
  }
  const points = []; for (let i = 0; i < 50; i++) { const a = i * 2.4, r = .2 + (i % 11) * .22; points.push(Math.cos(a) * r, .3 + i * .075, Math.sin(a) * r); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); const particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: c, size: kind === 'love' ? .08 : .15, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(particles); glow(g, 0, 1.5, 0, c, kind === 'love' ? 4 : 8); environment.add(g); effectModels.set(effect.id, { object: g, start: effectTime(effect), kind, particles, hearts, pulses });
}
function updateDynamicWorld() {
  for (const landmark of world.landmarks) if (!landmarkModels.has(landmark.id)) buildLandmark(landmark, landmarkRandom(landmark));
  for (const npc of world.npcs) { if (!npcModels.has(npc.id)) addNPC(npc); npcModels.get(npc.id).target = npc; }
  const activeGuests = new Set(); for (const p of world.players || []) { if (p.id === session?.playerId) continue; activeGuests.add(p.id); if (!guestModels.has(p.id)) { const object = personModel(p, true); object.position.set(p.x, height(p.x, p.z), p.z); environment.add(object); guestModels.set(p.id, { object, target: p }); } guestModels.get(p.id).target = p; }
  for (const [id, m] of guestModels) if (!activeGuests.has(id)) { disposeDynamic(m.object); guestModels.delete(id); }
  for (const effect of world.effects || []) if (!effectModels.has(effect.id) && Date.now() - effectTime(effect) < (effect.kind === 'ward' ? 5000 : 3500)) addEffect(effect);
  for (const culture of world.cultures || []) if (!cultureModels.has(culture.id)) { const npc = world.npcs.find(n => culture.members.includes(n.id)); if (!npc) continue; const g = new THREE.Group(); const x = npc.homeX + 6, z = npc.homeZ + 4; g.position.set(x, height(x, z), z); cylinder(g, 0, 2.7, 0, .06, .12, 5.4, materials.gold, 6); box(g, .75, 4.25, 0, 1.5, 2, .08, mat(culture.color)); const label = nameSprite(culture.name); label.position.set(0, 6, 0); label.scale.multiplyScalar(1.1); g.add(label); environment.add(g); cultureModels.set(culture.id, g); }
  updateUI();
}
function acceptWorld(next) { if (!next?.terrain) return; const changed = (next.worldId || String(next.terrain.seedInt)) !== worldSerial; if (!changed && next.revision < world.revision) return; world = next; if (changed) { player = { x: 0, z: 36 }; confirmedPlayer = { ...player }; yaw = 0; pitch = -.04; altitude = 0; flight = false; desiredFlight = false; touchFlight = false; clearTimeout(flightTimer); selectedNPC = null; npcMessages.clear(); buildWorld(); } else updateDynamicWorld(); }

function updateUI() {
  $('realm-name').textContent = world.seed; $('epoch').textContent = `Epoche ${world.epoch}`; $('culture-count').textContent = `${world.cultures.length} Kulturen`; $('guest-count').textContent = `${world.players.length} / 10 Gäste`;
  $('stat-epoch').textContent = world.epoch; $('stat-residents').textContent = world.npcs.length; $('stat-cultures').textContent = world.cultures.length; $('slots-summary').textContent = `${world.players.length} / 10`;
  const guests = $('guest-list'); guests.replaceChildren(); for (let slot = 1; slot <= 10; slot++) { const p = world.players.find(p => p.slot === slot); guests.append(textNode('div', `${String(slot).padStart(2, '0')}  ${p ? p.name : 'Freier Platz'}`, p ? 'guest-slot occupied' : 'guest-slot')); }
  const events = $('world-events'); events.replaceChildren(); for (const e of world.recentEvents.slice(-4).reverse()) events.append(textNode('p', e.text, 'small'));
  if (!document.activeElement?.matches('#seed-input')) $('seed-input').placeholder = world.seed;
}
function isPaused() { return !session || panel.open || help.open || document.hidden; }
function showPanel(view = 'world') { document.exitPointerLock?.(); held.clear(); dragging = false; if (!touchFlight) setFlight(false); if (!panel.open) panel.showModal(); selectPanel(view); }
function selectPanel(view) { for (const b of document.querySelectorAll('[data-panel]')) b.setAttribute('aria-selected', String(b.dataset.panel === view)); for (const s of document.querySelectorAll('[data-view]')) s.hidden = s.dataset.view !== view; if (view === 'knowledge') loadKnowledge(); if (view === 'board') loadBoard(); }
function findNearest() { let best = null, distance = Infinity; for (const npc of world.npcs) { const d = Math.hypot(player.x - npc.x, player.z - npc.z); if (d < distance) { best = npc; distance = d; } } return distance <= 30 ? { npc: best, distance } : null; }
function talkNearby() { nearest = findNearest(); if (!nearest) { toast('Geh näher zu einem Bewohner, um ein Gespräch zu beginnen.'); return; } selectedNPC = nearest.npc.id; $('talk-name').textContent = nearest.npc.name; $('talk-description').textContent = `${nearest.npc.role} · ${nearest.npc.culture ? world.cultures.find(c => c.id === nearest.npc.culture)?.name || 'Gemeinschaft' : 'Ein eigener Weg'}`; renderConversation(); showPanel('talk'); $('talk-input').focus(); }
function renderConversation() { $('conversation').replaceChildren(); for (const item of npcMessages.get(selectedNPC) || []) { const line = textNode('div', '', `chatline ${item.role}`); line.append(textNode('span', item.role === 'user' ? session.name : item.role === 'system' ? 'Weltverbindung' : world.npcs.find(n => n.id === selectedNPC)?.name || 'Bewohner', 'speaker'), textNode('p', item.text)); $('conversation').append(line); } $('conversation').scrollTop = $('conversation').scrollHeight; const source = [...(npcMessages.get(selectedNPC) || [])].reverse().find(item => item.source)?.source; $('talk-mode').textContent = source === 'ollama' ? 'Antwort vom verbundenen lokalen Sprachmodell · Ollama' : source === 'local-persona' ? 'Antwort aus der lokalen Figurenpersönlichkeit · ohne Sprachmodell' : 'Lokale Figurenpersönlichkeit · die Antwortquelle erscheint nach dem Gespräch.'; }

async function cast(spell) {
  if (castBusy || !session) return; castBusy = true;
  try { const distance = spell === 'ward' ? 0 : 9; const recipient = spell === 'love' ? findNearest()?.npc : null; const x = clamp(recipient?.x ?? player.x - Math.sin(yaw) * distance, -219, 219), z = clamp(recipient?.z ?? player.z - Math.cos(yaw) * distance, -219, 219); await syncMove(true); const result = await action('cast', { spell, x, z }); if (result.world) acceptWorld(result.world); toast(result.event?.text || `${({ bloom: 'Blüte', spark: 'Funken', ward: 'Schutz', love: 'LOVE' })[spell]} gewirkt.`); const b = document.querySelector(`[data-spell="${spell}"]`); b.classList.add('cast-active'); setTimeout(() => b.classList.remove('cast-active'), 800); } catch (e) { toast(e.message); } finally { castBusy = false; }
}
async function setFlight(active) {
  desiredFlight = Boolean(active); if (!session || flightBusy || desiredFlight === flight) return;
  const remaining = 170 - (performance.now() - lastFlightSent); clearTimeout(flightTimer);
  if (remaining > 0) { flightTimer = setTimeout(() => setFlight(desiredFlight), remaining); return; }
  const requested = desiredFlight; flightBusy = true; lastFlightSent = performance.now();
  try { const r = await action('levitate', { active: requested }); flight = Boolean(r.player?.levitating ?? requested); $('levitate-button').setAttribute('aria-pressed', String(flight)); $('exploration-status').textContent = flight ? 'Du schwebst über der Welt' : 'Zu Fuß unterwegs'; }
  catch (e) { desiredFlight = flight; touchFlight = flight; toast(e.message); }
  finally { flightBusy = false; if (desiredFlight !== flight) setFlight(desiredFlight); }
}
async function syncMove(force = false) {
  if (!session) return; if (movePromise) { if (force) await movePromise; else return; }
  if (performance.now() - lastMoveSent < (force ? 40 : 125)) return;
  lastMoveSent = performance.now();
  movePromise = action('move', { x: player.x, z: player.z, yaw });
  try { const r = await movePromise; if (r.player) { confirmedPlayer = { x: r.player.x, z: r.player.z }; if (Math.hypot(r.player.x - player.x, r.player.z - player.z) > 4) player = { ...confirmedPlayer }; } }
  catch (e) { player = { ...confirmedPlayer }; if (force) throw e; if (performance.now() - lastMoveError > 5000) { toast(`Bewegung synchronisiert: ${e.message}`); lastMoveError = performance.now(); } }
  finally { movePromise = null; }
}

function setupLook() {
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', e => { if (!session || isPaused()) return; dragging = true; lastTouch = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (isPaused()) return; let dx = 0, dy = 0; if (document.pointerLockElement === canvas) { dx = e.movementX; dy = e.movementY; } else if (dragging && lastTouch) { dx = e.clientX - lastTouch.x; dy = e.clientY - lastTouch.y; lastTouch = { x: e.clientX, y: e.clientY }; } else return; yaw -= dx * .003; pitch = clamp(pitch - dy * .0025, -1.22, 1.12); });
  const stop = () => { dragging = false; lastTouch = null; }; canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
  $('look-button').addEventListener('click', async () => { try { await canvas.requestPointerLock(); } catch { toast('Zum Umsehen die freie Spielfläche ziehen.'); } });
}
function setupControls() {
  addEventListener('keydown', e => { if (e.target.matches('input,textarea,select') || isPaused()) return; if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault(); held.add(e.code); if (e.repeat) return; if (e.code === 'Space') setFlight(true); if (e.code === 'KeyE') talkNearby(); if (['Digit1','Digit2','Digit3','Digit4'].includes(e.code)) cast(['bloom','spark','ward','love'][Number(e.code.at(-1)) - 1]); if (e.code === 'KeyM') showPanel(); });
  addEventListener('keyup', e => { held.delete(e.code); if (e.code === 'Space' && !touchFlight) setFlight(false); });
  addEventListener('blur', () => { held.clear(); dragging = false; if (!touchFlight) setFlight(false); });
  for (const button of document.querySelectorAll('[data-move]')) { const code = ({ forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD' })[button.dataset.move]; button.addEventListener('pointerdown', e => { e.preventDefault(); held.add(code); button.setPointerCapture(e.pointerId); }); for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type, () => held.delete(code)); }
  $('levitate-button').onclick = () => { touchFlight = !desiredFlight; setFlight(touchFlight); }; for (const id of ['talk-button','nearby-talk-button']) $(id).onclick = talkNearby;
  for (const button of document.querySelectorAll('[data-spell]')) button.onclick = () => cast(button.dataset.spell);
  $('menu-button').onclick = () => showPanel(); $('brand-button').onclick = e => { e.preventDefault(); showPanel(); }; $('close-panel').onclick = () => panel.close();
  for (const button of document.querySelectorAll('[data-panel]')) button.onclick = () => selectPanel(button.dataset.panel);
  $('help-button').onclick = () => { document.exitPointerLock?.(); held.clear(); help.showModal(); }; $('close-help').onclick = $('resume-button').onclick = () => help.close();
  for (const button of document.querySelectorAll('[data-evolve]')) button.onclick = async () => { button.disabled = true; try { const r = await action('evolve', { steps: Number(button.dataset.evolve) }); acceptWorld(r.world); toast(`Epoche ${world.epoch}: Die Welt ist weitergewachsen.`); } catch (e) { toast(e.message); } finally { button.disabled = false; } };
  $('join-form').onsubmit = joinWorld; $('talk-form').onsubmit = sendTalk; $('world-form').onsubmit = changeWorld; $('export-button').onclick = exportWorld; $('leave-button').onclick = leaveWorld;
}

async function joinWorld(e) { e.preventDefault(); $('enter-button').disabled = true; $('join-status').textContent = 'Dein Platz in der Welt wird geöffnet …'; try { const name = $('guest-name').value.trim(); const r = await api('/api/join', { name }); session = { token: r.token, playerId: r.playerId, name, slot: r.slot }; sessionStorage.setItem(sessionKey, JSON.stringify(session)); acceptWorld(r.world); const own = r.world.players.find(p => p.id === session.playerId); if (own) { player = { x: own.x, z: own.z }; confirmedPlayer = { ...player }; } $('entry').hidden = true; $('game-ui').hidden = false; toast(`Willkommen, ${name}. Nara wartet am Weg zur Zitadelle.`, 6500); renderer.domElement.focus(); } catch (error) { $('join-status').textContent = error.message; } finally { $('enter-button').disabled = false; } }
async function sendTalk(e) {
  e.preventDefault(); if ($('talk-send').disabled || !session) return;
  if (!selectedNPC) { toast('Wähle eine Person in deiner Nähe.'); return; }
  const input = $('talk-input'), message = input.value.trim(); if (!message) return;
  const npcId = selectedNPC, conversationWorld = world.worldId, conversationSession = session, list = npcMessages.get(npcId) || [];
  const isCurrent = () => session === conversationSession && world.worldId === conversationWorld && selectedNPC === npcId && npcMessages.get(npcId) === list;
  $('talk-send').disabled = true; $('talk-send').textContent = 'Hört dir zu …';
  list.push({ role: 'user', text: message }); npcMessages.set(npcId, list); input.value = ''; renderConversation();
  try {
    await syncMove(true);
    if (session !== conversationSession || world.worldId !== conversationWorld) return;
    const r = await api('/api/talk', { token: conversationSession.token, npcId, message });
    list.push({ role: 'npc', text: r.reply, source: r.source });
    if (isCurrent()) renderConversation();
  } catch (error) { list.push({ role: 'system', text: error.message }); if (isCurrent()) renderConversation(); }
  finally { $('talk-send').disabled = false; $('talk-send').textContent = 'Sprechen ↗'; }
}
async function changeWorld(e) { e.preventDefault(); const button = e.submitter, seed = $('seed-input').value.trim(); if (!seed) return; button.disabled = true; try { const r = await api('/api/world', { token: session.token, seed }); acceptWorld(r.world); panel.close(); $('seed-input').value = ''; toast(`Du betrittst „${seed}“. Der frühere Weltstand ist gespeichert.`, 6000); } catch (error) { toast(error.message); } finally { button.disabled = false; } }
async function exportWorld() { try { const data = await api('/api/export'); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `HALVETH-Realms-Epoche-${world.epoch}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); toast('Weltstand als JSON exportiert.'); } catch (e) { toast(e.message); } }
async function leaveWorld() { try { await api('/api/leave', { token: session.token }); } catch (e) { toast(e.message); return; } session = null; sessionStorage.removeItem(sessionKey); held.clear(); flight = false; desiredFlight = false; touchFlight = false; clearTimeout(flightTimer); panel.close(); $('game-ui').hidden = true; $('entry').hidden = false; $('join-status').textContent = 'Dein Gastplatz ist jetzt wieder frei.'; }
async function loadKnowledge() { if ($('knowledge-list').children.length) return; try { const data = await api('/api/knowledge'); const rows = Array.isArray(data) ? data : data.cards || data.sources || data.items || []; for (const card of rows) { const e = textNode('article', '', 'source-card'); e.append(textNode('span', card.topic || card.category || card.domain || 'QUELLE', 'eyebrow'), textNode('h4', card.title || card.name), textNode('p', card.summary || card.description || ''), textNode('p', card.designUse || card.application || '', 'small')); const url = card.url || card.sourceUrl; if (url && /^https?:\/\//.test(url)) { const a = textNode('a', card.publisher || 'Originalquelle ansehen ↗'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; e.append(a); } if (card.license) e.append(textNode('p', card.license, 'small muted')); $('knowledge-list').append(e); } } catch (e) { toast(e.message); } }
async function loadBoard() { try { const data = await api('/api/board'); const rows = Array.isArray(data) ? data : data.tasks || data.items || []; $('board-list').replaceChildren(); for (const status of ['Neu','In Arbeit','Erledigt']) { const group = textNode('section', '', 'board-column'); const matching = rows.filter(t => t.status === status); group.append(textNode('h4', `${status} · ${matching.length}`)); for (const item of matching) { const card = textNode('article', '', 'board-card'); card.append(textNode('strong', item.title || item.name), textNode('p', item.description || item.detail || '', 'small')); group.append(card); } $('board-list').append(group); } } catch (e) { toast(e.message); } }

function animate(now) {
  requestAnimationFrame(animate); const dt = Math.min((now - (lastFrame || now)) / 1000, .05); lastFrame = now; elapsed += dt;
  if (!world) return;
  if (!isPaused()) {
    const forward = Number(held.has('KeyW') || held.has('ArrowUp')) - Number(held.has('KeyS') || held.has('ArrowDown'));
    const side = Number(held.has('KeyD') || held.has('ArrowRight')) - Number(held.has('KeyA') || held.has('ArrowLeft'));
    if (forward || side) { const speed = held.has('ShiftLeft') || held.has('ShiftRight') ? 11 : 6.8; const norm = Math.hypot(forward, side); let nx = player.x + (-Math.sin(yaw) * forward + Math.cos(yaw) * side) / norm * speed * dt, nz = player.z + (-Math.cos(yaw) * forward - Math.sin(yaw) * side) / norm * speed * dt; nx = clamp(nx, -219, 219); nz = clamp(nz, -219, 219); if (!colliders.some(c => altitude < c.top && Math.hypot(nx - c.x, nz - c.z) < c.radius + .5)) { player.x = nx; player.z = nz; } syncMove(); }
  }
  altitude = THREE.MathUtils.damp(altitude, flight ? 8 : 0, 2.6, dt);
  const ground = Math.max(height(player.x, player.z), -.6); camera.position.set(player.x, ground + 2.1 + altitude, player.z); camera.rotation.set(pitch, yaw, 0);
  if (!session) { camera.position.set(Math.sin(elapsed * .017) * 7, height(0, 36) + 4.8, 40); camera.lookAt(0, height(0, 0) + 8, 0); }
  if (portal) portal.material.uniforms.time.value = elapsed; if (ocean) ocean.material.uniforms.time.value = elapsed;
  // Rendering-only light cycle. Epoch evolution itself remains server-owned.
  const daylight = .72 + Math.sin(elapsed * .018 + world.epoch * .02) * .28; sun.intensity = 1.4 + daylight * 1.8; skyLight.intensity = 1.1 + daylight; ocean.material.uniforms.daylight.value = daylight;
  const bg = new THREE.Color('#59697d').lerp(new THREE.Color('#c5d8d8'), daylight); scene.background.copy(bg); scene.fog.color.copy(bg);
  const stars = environment.getObjectByName('stars'); if (stars) stars.material.opacity = .65 * (1 - daylight);
  for (const { object, target } of npcModels.values()) { const dx = target.x - object.position.x, dz = target.z - object.position.z; object.position.x += dx * Math.min(dt * 1.3, 1); object.position.z += dz * Math.min(dt * 1.3, 1); object.position.y = height(object.position.x, object.position.z); if (Math.hypot(dx, dz) > .08) object.rotation.y = Math.atan2(dx, dz); object.userData.label.visible = Math.hypot(player.x - target.x, player.z - target.z) < 38; }
  for (const { object, target } of guestModels.values()) { object.position.lerp(v.set(target.x, height(target.x, target.z) + (target.levitating ? 8 : 0), target.z), Math.min(dt * 8, 1)); object.rotation.y = target.yaw + Math.PI; }
  for (const item of fireflies) { if (item.kind === 'crystal') { item.object.rotation.y += dt * .24; item.object.position.y = item.baseY + Math.sin(elapsed * .6) * .4; } else item.object.position.y = item.baseY + Math.sin(elapsed + item.phase) * .6; }
  if (birds) { birds.position.set(Math.sin(elapsed * .065) * 75, 40 + Math.sin(elapsed * .12) * 5, -35 + Math.cos(elapsed * .065) * 50); birds.rotation.y = -elapsed * .065; birds.children.forEach((b, i) => b.rotation.z = Math.sin(elapsed * 4 + i) * .17); }
  for (const [id, item] of effectModels) {
    const age = (Date.now() - item.start) / 1000; item.particles.rotation.y += dt * .4; item.particles.position.y = Math.sin(elapsed) * .25;
    if (item.kind === 'love') {
      const fade = clamp(Math.min(age * 4, (3.5 - age) * 1.3), 0, 1);
      for (const h of item.hearts) { h.object.quaternion.copy(camera.quaternion); h.object.position.set(h.x + Math.sin(age * 1.6 + h.phase) * .14, h.y + age * .48, h.z); h.object.scale.setScalar(.42 + Math.sin(age * 3 + h.phase) * .055); h.object.material.opacity = fade * .88; }
      item.pulses.forEach((ring, i) => { const phase = (age * .7 + i * .5) % 1; ring.scale.setScalar(.7 + phase * 2.8); ring.material.opacity = (1 - phase) * fade * .30; });
      item.particles.material.opacity = fade * .65;
    }
    if (age > (item.kind === 'ward' ? 5 : 3.5)) { disposeDynamic(item.object); effectModels.delete(id); }
  }
  if (now - lastMapUI > 250 && session) { lastMapUI = now; nearest = findNearest(); $('npc-prompt').hidden = !nearest || isPaused(); if (nearest) $('npc-prompt-name').textContent = `${nearest.npc.name} · ${nearest.npc.role}`; const nearLand = [...world.landmarks].sort((a,b) => Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z))[0]; $('location-name').textContent = nearLand && Math.hypot(nearLand.x-player.x,nearLand.z-player.z)<45 ? nearLand.name : height(player.x, player.z)<1 ? 'Die türkisfarbene Küste' : 'Die weiten Lichtungen'; const angle = ((-yaw * 180 / Math.PI) % 360 + 360) % 360; $('compass-label').textContent = `${['N','NO','O','SO','S','SW','W','NW'][Math.round(angle / 45) % 8]}  ·  ${Math.round(angle)}°`; }
  renderer.render(scene, camera);
}

async function start() {
  setupControls();
  try { initRenderer(); world = await api('/api/state'); buildWorld();
    try { const saved = JSON.parse(sessionStorage.getItem(sessionKey)); if (saved?.token && saved?.playerId) { session = saved; const current = await api('/api/state'); const own = current.players.find(p => p.id === saved.playerId); if (own) { acceptWorld(current); player = { x: own.x, z: own.z }; confirmedPlayer = { ...player }; yaw = own.yaw || 0; flight = Boolean(own.levitating); desiredFlight = flight; touchFlight = flight; $('entry').hidden = true; $('game-ui').hidden = false; } else { session = null; sessionStorage.removeItem(sessionKey); } } } catch { session = null; sessionStorage.removeItem(sessionKey); }
    $('loading').hidden = true; requestAnimationFrame(animate);
    setInterval(async () => { if (document.hidden) return; try { const next = await api('/api/state'); acceptWorld(next); } catch { if (session) toast('Die lokale Verbindung ist unterbrochen. Deine letzte Welt bleibt sichtbar.'); } }, 2200);
  } catch (e) { $('loading').hidden = true; $('join-status').textContent = `Die 3D-Welt konnte nicht starten: ${e.message}. Prüfe den lokalen Server und WebGL im Browser.`; $('enter-button').disabled = true; console.error('HALVETH Realms start:', e); }
}
start();
