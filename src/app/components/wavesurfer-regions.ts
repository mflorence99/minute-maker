import { CSSVariableProxy } from '../utils';
import { WaveSurferPlugin } from './wavesurfer-plugin';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { PluginDefinition } from 'wavesurfer.js/types/plugin';
import { RegionsPluginParams } from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';

import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';

import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: WaveSurferPluginComponent,
      useExisting: forwardRef(() => WaveSurferRegionsComponent)
    }
  ],
  selector: 'mm-wavesurfer-regions',
  template: ``,
  styles: [':host { display: none }']
})
export class WaveSurferRegionsComponent implements WaveSurferPlugin {
  @Input() params: RegionsPluginParams = {};

  #host: HTMLElement = inject(ElementRef).nativeElement;

  #proxy = new CSSVariableProxy<RegionsPluginParams>(
    this.#host,
    'wavesurfer-regions'
  );

  create(): PluginDefinition {
    return RegionsPlugin.create(this.#proxy.proxyFactory(this.params));
  }
}
