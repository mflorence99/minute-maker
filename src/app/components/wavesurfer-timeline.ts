import { CSSVariableProxy } from '../utils';
import { WaveSurferPlugin } from './wavesurfer-plugin';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { PluginDefinition } from 'wavesurfer.js/types/plugin';
import { TimelinePluginParams } from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';

import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';

import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: WaveSurferPluginComponent,
      useExisting: forwardRef(() => WaveSurferTimelineComponent)
    }
  ],
  selector: 'mm-wavesurfer-timeline',
  template: ``
})
export class WaveSurferTimelineComponent implements WaveSurferPlugin {
  @Input() params: TimelinePluginParams = {};

  #host: HTMLElement = inject(ElementRef).nativeElement;

  #proxy = new CSSVariableProxy<TimelinePluginParams>(
    this.#host,
    'wavesurfer-timeline'
  );

  create(): PluginDefinition {
    return TimelinePlugin.create(
      this.#proxy.proxyFactory({
        container: this.#host,
        ...this.params
      })
    );
  }
}
