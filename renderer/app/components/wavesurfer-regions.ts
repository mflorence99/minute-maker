import { WaveSurferComponent } from './wavesurfer';
import { WaveSurferPlugin } from './wavesurfer-plugin';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';
import { WaveSurferRegionComponent } from './wavesurfer-region';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { GenericPlugin } from 'wavesurfer.js/dist/base-plugin';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { QueryList } from '@angular/core';
import { RegionsPluginOptions } from 'wavesurfer.js/dist/plugins/regions';

import { combineLatest } from 'rxjs';
import { filter } from 'rxjs';
import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { startWith } from 'rxjs';

import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: WaveSurferPluginComponent,
      useExisting: forwardRef(() => WaveSurferRegionsComponent)
    }
  ],
  selector: 'mm-wavesurfer-regions',
  template: `
    <ng-content />
  `,
  styles: [
    `
      host {
        display: none;
      }
    `
  ]
})
export class WaveSurferRegionsComponent
  implements AfterContentInit, OnDestroy, OnInit, WaveSurferPlugin
{
  @Input() options: Partial<RegionsPluginOptions> = undefined;

  @ContentChildren(WaveSurferRegionComponent)
  regions$: QueryList<WaveSurferRegionComponent>;

  plugin: RegionsPlugin;

  wavesurfer = inject(WaveSurferComponent);

  create(): GenericPlugin {
    return this.plugin;
  }

  // 👇 respond to region changes -- BUT wait until WaveSurfer is ready
  ngAfterContentInit(): void {
    combineLatest([
      this.regions$.changes.pipe(startWith(this.regions$)),
      this.wavesurfer.ready
    ])
      .pipe(
        filter(([_, ready]) => ready),
        map(([regions]) => regions)
      )
      .subscribe((regions) => {
        this.plugin.clearRegions();
        regions.forEach((region) => {
          this.plugin.addRegion(region.params);
        });
      });
  }

  ngOnDestroy(): void {
    this.plugin.destroy();
  }

  ngOnInit(): void {
    this.plugin = RegionsPlugin.create(this.options);
  }
}
