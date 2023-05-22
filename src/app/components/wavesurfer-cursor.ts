import { WaveSurferPlugin } from './wavesurfer-plugin';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { CursorPluginParams } from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js';
import { Input } from '@angular/core';
import { PluginDefinition } from 'wavesurfer.js/types/plugin';

import { forwardRef } from '@angular/core';

import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: WaveSurferPluginComponent,
      useExisting: forwardRef(() => WaveSurferCursorComponent)
    }
  ],
  selector: 'mm-wavesurfer-cursor',
  template: ``,
  styles: [':host { display: none }']
})
export class WaveSurferCursorComponent implements WaveSurferPlugin {
  @Input() params: CursorPluginParams = {};

  create(): PluginDefinition {
    return CursorPlugin.create({
      ...this.params
    });
  }
}
