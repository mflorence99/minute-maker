import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { RegionParams } from 'wavesurfer.js/dist/plugins/regions';
import { WaveSurferRegionsComponent } from '#mm/components/wavesurfer-regions';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-wavesurfer-region',
  template: ``,
  styles: ['host { display: none; }']
})
export class WaveSurferRegionComponent {
  #params: Partial<RegionParams> = {};
  #regions = inject(WaveSurferRegionsComponent);

  @Input() get params(): Partial<RegionParams> {
    return this.#params;
  }

  set params(params: Partial<RegionParams>) {
    this.#params = params;
    const region = this.#regions.regionByID[params.id];
    if (region) region.setOptions(params);
  }
}
