'use strict';
// Electron's official main-process APIs: native window, isolated renderer, local game lifecycle.
const { app, BrowserWindow, Menu, dialog, shell, session, ipcMain } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createHash, randomBytes } = require('node:crypto');
const { defaults, validatePreferences } = require('./preferences.cjs');
const ROOT = path.resolve(__dirname, '..');
const selfTest = process.argv.includes('--halveth-self-test');
const qaArgument = process.argv.find(arg => arg.startsWith('--halveth-qa-dir='));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let mainWindow, game, gameOrigin, gameSession, logsDir, worldDir, runPath;
let preferences = { ...defaults }, preferencesTail = Promise.resolve();
let allowQuit = false, quitting = false, started = false, consoleCount = 0;
const receipt = {
  schema: 'halveth-realms-desktop-run-v1', runId: `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomBytes(4).toString('hex')}`,
  appVersion: app.getVersion(), packaged: app.isPackaged, selfTest,
  versions: { electron: process.versions.electron, chrome: process.versions.chrome, node: process.versions.node },
  startedAt: new Date().toISOString(), status: 'STARTING', rendererReady: false, checkpointSaved: false,
  failures: [], events: [],
};
function event(kind, details = {}) {
  const entry = { at: new Date().toISOString(), kind, ...details };
  receipt.events.push(entry);
  if (receipt.events.length > 250) receipt.events.splice(0, receipt.events.length - 250);
  if (!logsDir) return;
  fs.appendFileSync(path.join(logsDir, `${receipt.runId}.jsonl`), JSON.stringify(entry) + '\n');
  fs.writeFileSync(runPath, JSON.stringify(receipt, null, 2));
  fs.writeFileSync(path.join(logsDir, 'desktop-last-run.json'), JSON.stringify(receipt, null, 2));
}
function failure(kind, error) {
  const message = String(error?.message || error).slice(0, 1400);
  receipt.failures.push({ kind, message }); event(kind, { message });
}
async function reportError(title, error) {
  failure(title, error);
  if (!selfTest) await dialog.showMessageBox(mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
    { type: 'error', title: 'HALVETH Realms', message: title, detail: String(error?.message || error), buttons: ['OK'] });
}
async function detectOllama() {
  if (selfTest || process.argv.includes('--offline') || process.env.REALMS_OLLAMA === '0') return false;
  if (process.env.REALMS_OLLAMA === '1') return true;
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(1200) });
    if (!response.ok) return false;
    const result = await response.json();
    return result.models?.some(model => model.name === (process.env.REALMS_OLLAMA_MODEL || 'hermes3:8b')) === true;
  } catch { return false; }
}
async function finishQuit() {
  if (quitting) return;
  quitting = true; event('shutdown-requested');
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setTitle('HALVETH Realms – Welt wird gespeichert …');
  try {
    await preferencesTail;
    if (game) { await game.close(); receipt.checkpointSaved = true; event('world-checkpoint-saved'); }
    receipt.status = selfTest ? (receipt.selfTestResult?.passed && !receipt.failures.length ? 'SELF_TEST_PASS' : 'SELF_TEST_FAIL') : (receipt.failures.length ? 'CLOSED_WITH_NOTES' : 'CLOSED');
    receipt.finishedAt = new Date().toISOString();
    event('shutdown-complete');
    allowQuit = true;
    if (selfTest && receipt.status !== 'SELF_TEST_PASS') app.exit(1);
    else app.quit();
  } catch (error) {
    quitting = false;
    await reportError('Der Weltstand konnte beim Beenden nicht vollständig gespeichert werden.', error);
    if (selfTest) { receipt.status = 'SELF_TEST_FAIL'; event('shutdown-failed'); app.exit(1); }
  }
}
async function clearHttpCache(reload = true) {
  const beforeBytes = await gameSession.getCacheSize();
  await gameSession.clearCache();
  event('http-cache-cleared', { beforeBytes, afterBytes: await gameSession.getCacheSize(), worldDataChanged: false });
  if (reload && mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reloadIgnoringCache();
}
function installMenu() {
  const guard = fn => () => Promise.resolve().then(fn).catch(error => reportError('Die Aktion konnte nicht abgeschlossen werden.', error));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Spiel', submenu: [
      { label: 'Ansicht neu laden', accelerator: 'F5', click: () => mainWindow?.webContents.reload() },
      { type: 'separator' }, { label: 'Speichern und beenden', accelerator: 'Alt+F4', click: () => app.quit() },
    ] },
    { label: 'Bearbeiten', submenu: [ { role: 'undo', label: 'Rückgängig' }, { role: 'redo', label: 'Wiederholen' }, { type: 'separator' },
      { role: 'cut', label: 'Ausschneiden' }, { role: 'copy', label: 'Kopieren' }, { role: 'paste', label: 'Einfügen' }, { role: 'selectAll', label: 'Alles auswählen' } ] },
    { label: 'Ansicht', submenu: [
      { label: 'Vollbild', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
      { role: 'resetZoom', label: 'Oberfläche: Originalgröße' },
    ] },
    { label: 'Pflege', submenu: [
      { label: 'Ansichts-Cache leeren und neu laden', click: guard(() => clearHttpCache()) },
      { label: 'Eigene Weltstände öffnen', click: guard(async () => { const error = await shell.openPath(worldDir); if (error) throw new Error(error); }) },
      { label: 'Start- und Fehlerprotokolle öffnen', click: guard(async () => { const error = await shell.openPath(logsDir); if (error) throw new Error(error); }) },
    ] },
    { label: 'Hilfe', submenu: [
      { label: 'Über HALVETH Realms', click: guard(() => dialog.showMessageBox(mainWindow, {
        type: 'info', title: 'HALVETH Realms', message: `HALVETH Realms ${app.getVersion()}`,
        detail: `Ein eigenständiger, lokal spielbarer Fantasy-Prototyp.\n\nWASD: bewegen · Leertaste: schweben · E: sprechen\n1–4: Blüte, Funken, Schutz, LOVE · F11: Vollbild\n\nWeltstände werden auf diesem Computer gespeichert. Der Ansichts-Cache kann getrennt geleert werden.\n\nMIT · Quellcode: Juri-Halveth/halveth-realms`, buttons: ['Weiter spielen'],
      })) },
    ] },
  ]));
}
function allowExternal(url) {
  try { const target = new URL(url); return ['https:', 'http:'].includes(target.protocol) && target.origin !== gameOrigin; }
  catch { return false; }
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: selfTest ? 1440 : 1500, height: selfTest ? 960 : 960, minWidth: 980, minHeight: 680,
    title: 'HALVETH Realms', backgroundColor: '#101b22', show: false,
    icon: path.join(ROOT, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), session: gameSession,
      sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true,
      additionalArguments: [`--halveth-app-version=${app.getVersion()}`],
    },
  });
  const contents = mainWindow.webContents;
  receipt.windowPreferences = { sandbox: true, contextIsolation: true, nodeIntegration: false };
  mainWindow.on('page-title-updated', event => event.preventDefault());
  mainWindow.once('ready-to-show', () => { mainWindow.show(); mainWindow.focus(); event('native-window-shown'); });
  mainWindow.on('close', closeEvent => { if (!allowQuit) { closeEvent.preventDefault(); app.quit(); } });
  mainWindow.on('closed', () => { mainWindow = null; });
  contents.setWindowOpenHandler(({ url }) => { if (allowExternal(url)) shell.openExternal(url).catch(error => failure('external-link-error', error)); return { action: 'deny' }; });
  contents.on('will-navigate', (navigationEvent, url) => {
    if (new URL(url).origin !== gameOrigin) { navigationEvent.preventDefault(); if (allowExternal(url)) shell.openExternal(url).catch(error => failure('external-link-error', error)); }
  });
  contents.on('did-finish-load', () => { receipt.rendererReady = true; event('renderer-ready', { url: contents.getURL() }); });
  contents.on('did-fail-load', (_event, code, description, url, isMainFrame) => {
    if (code !== -3) failure('renderer-load-failed', `code=${code}, ${description}, mainFrame=${isMainFrame}, ${url}`);
  });
  contents.on('render-process-gone', (_event, details) => failure('renderer-process-gone', `${details.reason}; exitCode=${details.exitCode}`));
  contents.on('preload-error', (_event, _preloadPath, error) => failure('renderer-preload-error', error));
  contents.on('unresponsive', () => event('renderer-unresponsive'));
  contents.on('responsive', () => event('renderer-responsive'));
  contents.on('console-message', (consoleEvent, ...args) => {
    const message = typeof consoleEvent.message === 'string' ? consoleEvent : (typeof args[0] === 'object' ? args[0] : { level: args[0], message: args[1], lineNumber: args[2], sourceId: args[3] });
    if (consoleCount++ < 100) event('renderer-console', { level: message.level, message: String(message.message).slice(0, 1400), lineNumber: message.lineNumber });
    if (message.level === 'error' || message.level === 3) receipt.failures.push({ kind: 'renderer-console-error', message: String(message.message).slice(0, 1400) });
  });
  return mainWindow.loadURL(gameOrigin);
}
async function waitFor(predicate, label, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { const result = await predicate(); if (result) return result; await delay(120); }
  throw new Error(`Desktop-Selbsttest: ${label} wurde innerhalb von ${timeout / 1000} Sekunden nicht beobachtet.`);
}
async function capture(name) {
  const image = await mainWindow.webContents.capturePage();
  if (image.isEmpty()) throw new Error('Das Spielfenster hat kein erfassbares Bild geliefert.');
  const bytes = image.toPNG();
  const file = path.join(logsDir, name);
  await fsp.writeFile(file, bytes);
  const observation = { filename: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), size: image.getSize() };
  event('window-captured', observation);
  return observation;
}
async function runSelfTest() {
  try {
    const contents = mainWindow.webContents;
    await waitFor(() => contents.executeJavaScript(`(() => {
      const canvas=document.querySelector('#scene canvas'), loading=document.querySelector('#loading'), enter=document.querySelector('#enter-button');
      return Boolean(canvas && canvas.width>0 && loading?.hidden && enter && !enter.disabled && window.halvethDesktop?.isDesktop===true);
    })()`), 'sichtbare 3D-Welt und Desktop-Brücke');
    await delay(700);
    const entryCapture = await capture('desktop-entry.png');
    const api = async (route, body) => {
      const response = await fetch(`${gameOrigin}${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      return result;
    };
    const joined = await api('/api/join', { name: 'Desktop API QA' });
    await waitFor(() => game.snapshot().players.some(player => player.id === joined.playerId), 'Gastbeitritt über die lokale Spiel-API');
    const before = game.snapshot();
    await api('/api/action', { token: joined.token, kind: 'cast', spell: 'love', x: 0, z: 36 });
    const after = await waitFor(() => { const state = game.snapshot(); return state.effects.some(effect => effect.kind === 'love') ? state : null; }, 'LOVE über die lokale Spiel-API');
    // The untouched renderer obtains state through its normal polling loop.
    await delay(2400);
    const renderDiagnostics = await contents.executeJavaScript(`({
      fpsMeterText: document.querySelector('#fps-meter')?.textContent ?? null,
      renderPerformanceText: document.querySelector('#render-performance')?.textContent ?? null,
      documentHidden: document.hidden,
      documentHasFocus: document.hasFocus()
    })`);
    renderDiagnostics.windowFocused = mainWindow.isFocused();
    renderDiagnostics.gpuFeatureStatus = app.getGPUFeatureStatus();
    renderDiagnostics.observedAt = new Date().toISOString();
    renderDiagnostics.minimumSettleMs = 2400;
    const fpsMatch = renderDiagnostics.fpsMeterText?.match(/^(\d+)\s+FPS$/);
    renderDiagnostics.measuredFps = fpsMatch ? Number(fpsMatch[1]) : null;
    renderDiagnostics.activeSample = !renderDiagnostics.documentHidden && renderDiagnostics.documentHasFocus && renderDiagnostics.windowFocused && Boolean(fpsMatch);
    renderDiagnostics.interpretation = !renderDiagnostics.activeSample ? 'NO_ACTIVE_FPS_SAMPLE'
      : renderDiagnostics.measuredFps <= 1 ? 'LOW_FRAME_RATE_REVIEW_REQUIRED' : 'ONE_NATIVE_SAMPLE_NO_GENERAL_FPS_GUARANTEE';
    event('native-render-diagnostics', renderDiagnostics);
    const loveCapture = await capture('desktop-self-test.png');
    const careIncreased = after.npcs.some(npc => npc.traits.care > before.npcs.find(previous => previous.id === npc.id).traits.care);
    const bridge = await contents.executeJavaScript(`({isDesktop:window.halvethDesktop.isDesktop,platform:window.halvethDesktop.platform,version:window.halvethDesktop.version})`);
    const gl = await contents.executeJavaScript(`(() => {const c=document.querySelector('#scene canvas');const gl=c.getContext('webgl2')||c.getContext('webgl');return {available:Boolean(gl),contextLost:gl?gl.isContextLost():null,width:c.width,height:c.height};})()`);
    const rendererPreferences = await contents.executeJavaScript(`window.halvethDesktop.getPreferences()`);
    const preferenceReadBridgeObserved = JSON.stringify(rendererPreferences) === JSON.stringify(preferences);
    await api('/api/leave', { token: joined.token });
    const functionalPassed = careIncreased && gl.available && !gl.contextLost && bridge.version === app.getVersion()
      && preferenceReadBridgeObserved && receipt.failures.length === 0;
    const passed = functionalPassed && renderDiagnostics.activeSample && renderDiagnostics.measuredFps > 1;
    receipt.selfTestResult = { passed, functionalPassed, renderDiagnostics, rendererLoaded: receipt.rendererReady, nativeWindowVisible: mainWindow.isVisible(), joinedGuestCount: after.players.length,
      actionPath: 'local-http-api', inputUiVerified: false, loveEffectObserved: true, careIncreased, preferenceReadBridgeObserved,
      worldId: after.worldId, epoch: after.epoch, bridge, webgl: gl, captures: [entryCapture, loveCapture] };
    event('self-test-completed', receipt.selfTestResult);
  } catch (error) { failure('self-test-failed', error); receipt.selfTestResult = { passed: false }; }
  await finishQuit();
}
async function boot() {
  app.setAppUserModelId('de.halveth.realms');
  worldDir = path.join(app.getPath('userData'), 'worlds');
  logsDir = app.getPath('logs');
  await fsp.mkdir(worldDir, { recursive: true }); await fsp.mkdir(logsDir, { recursive: true });
  runPath = path.join(logsDir, `${receipt.runId}.json`);
  event('desktop-starting', { appVersion: app.getVersion(), packaged: app.isPackaged, selfTest, worldDirectory: worldDir });
  const preferencePath = path.join(app.getPath('userData'), 'ui-preferences.json');
  try { preferences = validatePreferences(JSON.parse(await fsp.readFile(preferencePath, 'utf8'))); }
  catch (error) { if (error.code !== 'ENOENT') event('preferences-file-unreadable', { message: error.message, originalRetained: true }); }
  gameSession = session.fromPartition('persist:halveth-realms');
  const gameInputPermission = (contents, permission) => {
    try { return contents === mainWindow?.webContents && ['pointerLock', 'fullscreen'].includes(permission) && new URL(contents.getURL()).origin === gameOrigin; }
    catch { return false; }
  };
  gameSession.setPermissionRequestHandler((contents, permission, callback) => callback(gameInputPermission(contents, permission)));
  gameSession.setPermissionCheckHandler((contents, permission) => gameInputPermission(contents, permission));
  if (await gameSession.getCacheSize() > 256 * 1024 * 1024) await clearHttpCache(false);
  ipcMain.handle('halveth:get-preferences', ipcEvent => {
    if (ipcEvent.sender !== mainWindow?.webContents || new URL(ipcEvent.senderFrame.url).origin !== gameOrigin) throw new Error('Unbekanntes Spielfenster.');
    return { ...preferences };
  });
  ipcMain.handle('halveth:set-preferences', async (ipcEvent, value) => {
    if (ipcEvent.sender !== mainWindow?.webContents || new URL(ipcEvent.senderFrame.url).origin !== gameOrigin) throw new Error('Unbekanntes Spielfenster.');
    const next = validatePreferences(value);
    preferencesTail = preferencesTail.catch(() => {}).then(async () => {
      const temporary = preferencePath + '.tmp';
      await fsp.writeFile(temporary, JSON.stringify(next, null, 2)); await fsp.rename(temporary, preferencePath); preferences = next;
    });
    await preferencesTail; event('graphics-preferences-saved', { preferences: next }); return { ...next };
  });
  const { createGameServer } = await import(pathToFileURL(path.join(ROOT, 'server.mjs')).href);
  const ollamaEnabled = await detectOllama();
  game = await createGameServer({ dataDir: worldDir, host: '127.0.0.1', port: 0, ollamaEnabled,
    ollamaModel: process.env.REALMS_OLLAMA_MODEL || 'hermes3:8b', ...(selfTest ? { seed: 'HALVETH Desktop QA' } : {}) });
  const address = await game.start(); gameOrigin = address.url; started = true;
  event('integrated-server-ready', { host: address.host, port: address.port, ollamaEnabled, version: app.getVersion() });
  installMenu(); await createWindow();
  if (selfTest) await runSelfTest();
}
function initialize() {
  app.setName('HALVETH Realms');
  if (process.argv.includes('--halveth-print-paths')) {
    if (selfTest || qaArgument) throw new Error('--halveth-print-paths wird getrennt vom Selbsttest aufgerufen.');
    const userData = app.getPath('userData');
    const paths = { app: 'HALVETH Realms', appVersion: app.getVersion(), userData,
      worlds: path.join(userData, 'worlds'), realmDirectory: path.join(userData, 'worlds', 'realms'),
      currentWorld: path.join(userData, 'worlds', 'current.json'), logs: path.join(userData, 'logs'),
      browserCache: path.join(userData, 'browser-cache'), serverStarted: false, windowCreated: false };
    process.stdout.write(JSON.stringify(paths) + '\n', () => app.exit(0));
    return;
  }
  if (selfTest) {
    const target = qaArgument?.slice('--halveth-qa-dir='.length);
    if (!target || !path.isAbsolute(target) || !path.basename(path.resolve(target)).startsWith('halveth-realms-qa-')
      || path.resolve(target).toLowerCase() === path.resolve(app.getPath('userData')).toLowerCase()) throw new Error('Selbsttest benötigt --halveth-qa-dir=<absoluter eigener Ordner halveth-realms-qa-...>.');
    fs.mkdirSync(target, { recursive: true }); app.setPath('userData', path.resolve(target));
  } else if (qaArgument) throw new Error('--halveth-qa-dir ist ausschließlich mit --halveth-self-test gültig.');
  const cacheDir = path.join(app.getPath('userData'), 'browser-cache');
  fs.mkdirSync(cacheDir, { recursive: true }); app.setPath('sessionData', cacheDir);
  app.setAppLogsPath(path.join(app.getPath('userData'), 'logs'));
  if (!app.requestSingleInstanceLock()) { app.quit(); return; }
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } });
  app.on('before-quit', quitEvent => { if (!allowQuit && started) { quitEvent.preventDefault(); void finishQuit(); } });
  app.on('window-all-closed', () => { if (!quitting) app.quit(); });
  app.on('will-quit', () => { if (logsDir) event('electron-will-quit'); });
  app.on('quit', (_quitEvent, exitCode) => { receipt.exitCode = exitCode; if (logsDir) event('electron-quit', { exitCode }); });
  app.whenReady().then(boot).catch(async error => {
    await reportError('HALVETH Realms konnte nicht starten.', error);
    receipt.status = 'START_FAILED'; event('startup-failed');
    if (game) { try { await game.close(); } catch (closeError) { failure('startup-cleanup-failed', closeError); } }
    allowQuit = true; app.exit(1);
  });
}
try { initialize(); }
catch (error) { console.error(error.message); app.exit(1); }
