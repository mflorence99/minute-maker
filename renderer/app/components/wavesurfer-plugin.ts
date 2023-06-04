import { GenericPlugin } from 'wavesurfer.js/dist/base-plugin';
import { Injectable } from '@angular/core';

// 👇 https://sambleckley.com/writing/angular-mixed-type-contentchildren-that-share-an-interface.html

export type WaveSurferPlugin = {
  create(): GenericPlugin;
};

@Injectable()
export class WaveSurferPluginComponent {}
