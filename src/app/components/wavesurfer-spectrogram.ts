import { CSSVariableProxy } from '../utils';
import { WaveSurferPlugin } from './wavesurfer-plugin';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { PluginDefinition } from 'wavesurfer.js/types/plugin';
import { SpectrogramPluginParams } from 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram.min.js';

import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';

import SpectrogramPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram.min.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: WaveSurferPluginComponent,
      useExisting: forwardRef(() => WaveSurferSpectrogramComponent)
    }
  ],
  selector: 'mm-wavesurfer-spectrogram',
  template: ``
})
export class WaveSurferSpectrogramComponent implements WaveSurferPlugin {
  @Input() params: SpectrogramPluginParams = {};

  #host: HTMLElement = inject(ElementRef).nativeElement;

  #proxy = new CSSVariableProxy<SpectrogramPluginParams>(
    this.#host,
    'wavesurfer-spectrogram'
  );

  create(): PluginDefinition {
    return SpectrogramPlugin.create(
      this.#proxy.proxyFactory({
        container: this.#host,
        ...this.params
      })
    );
  }
}
