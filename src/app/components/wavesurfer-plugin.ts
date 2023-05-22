import { Injectable } from '@angular/core';
import { PluginDefinition } from 'wavesurfer.js/types/plugin';

// 👇 https://sambleckley.com/writing/angular-mixed-type-contentchildren-that-share-an-interface.html

export interface WaveSurferPlugin {
  create(): PluginDefinition;
}

@Injectable()
export class WaveSurferPluginComponent {}
