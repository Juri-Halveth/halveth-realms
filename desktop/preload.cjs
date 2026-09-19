'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const version = process.argv.find(arg => arg.startsWith('--halveth-app-version='))?.split('=').slice(1).join('=') || 'unknown';
contextBridge.exposeInMainWorld('halvethDesktop', Object.freeze({
  isDesktop: true,
  platform: process.platform,
  version,
  getPreferences: () => ipcRenderer.invoke('halveth:get-preferences'),
  setPreferences: value => ipcRenderer.invoke('halveth:set-preferences', value),
}));
