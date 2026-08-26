import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('api', {
  nodeVersion: process.versions.node
});