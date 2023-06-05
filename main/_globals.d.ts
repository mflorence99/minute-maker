/* eslint-disable no-var */
import { ipcRenderer } from 'electron';

declare global {
  var jsome: Function;
  var ipc: typeof ipcRenderer;
}
