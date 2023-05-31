import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { RegionParams } from 'wavesurfer.js/dist/plugins/regions';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-wavesurfer-region',
  template: ``,
  styles: [
    `
      host {
        display: none;
      }
    `
  ]
})
export class WaveSurferRegionComponent {
  @Input() params: Partial<RegionParams> = {};
}
