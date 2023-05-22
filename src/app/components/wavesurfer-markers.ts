import { WaveSurferPlugin } from './wavesurfer-plugin';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MarkerParams } from 'wavesurfer.js/dist/plugin/wavesurfer.markers.min.js';
import { PluginDefinition } from 'wavesurfer.js/types/plugin';

import { forwardRef } from '@angular/core';

import MarkersPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.markers.min.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: WaveSurferPluginComponent,
      useExisting: forwardRef(() => WaveSurferMarkersComponent)
    }
  ],
  selector: 'mm-wavesurfer-markers',
  template: ``,
  styles: [':host { display: none }']
})
export class WaveSurferMarkersComponent implements WaveSurferPlugin {
  @Input() markers: MarkerParams[] = [];

  create(): PluginDefinition {
    return MarkersPlugin.create({
      markers: this.markers
    });
  }
}
