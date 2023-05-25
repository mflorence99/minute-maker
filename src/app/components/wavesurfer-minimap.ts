import { CSSVariableProxy } from '../utils';
import { WaveSurferPlugin } from './wavesurfer-plugin';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { MinimapPluginParams } from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';
import { PluginDefinition } from 'wavesurfer.js/types/plugin';

import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';

import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: WaveSurferPluginComponent,
      useExisting: forwardRef(() => WaveSurferMinimapComponent)
    }
  ],
  selector: 'mm-wavesurfer-minimap',
  template: ``
})
export class WaveSurferMinimapComponent implements WaveSurferPlugin {
  @Input() params: MinimapPluginParams = {};

  #host: HTMLElement = inject(ElementRef).nativeElement;

  #proxy = new CSSVariableProxy<MinimapPluginParams>(
    this.#host,
    'wavesurfer-minimap'
  );

  create(): PluginDefinition {
    return MinimapPlugin.create(
      this.#proxy.proxyFactory({
        container: this.#host,
        ...this.params
      })
    );
  }
}
