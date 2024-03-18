import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { GenericPlugin } from 'wavesurfer.js/dist/base-plugin';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { TimelinePluginOptions } from 'wavesurfer.js/dist/plugins/timeline';
import { WaveSurferPlugin } from '#mm/components/wavesurfer-plugin';
import { WaveSurferPluginComponent } from '#mm/components/wavesurfer-plugin';

import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { output } from '@angular/core';

import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';

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
export class WaveSurferTimelineComponent
  implements OnDestroy, OnInit, WaveSurferPlugin
{
  options = input<Partial<TimelinePluginOptions>>({});
  plugin: TimelinePlugin;
  ready = output();

  #host = inject(ElementRef);

  create(): GenericPlugin {
    return this.plugin;
  }

  ngOnDestroy(): void {
    this.plugin.destroy();
  }

  ngOnInit(): void {
    // 👇 create the plugin
    this.plugin = TimelinePlugin.create({
      container: this.#host.nativeElement,
      ...this.options()
    });
    // 👇 bind to events
    this.plugin.on('ready', () => this.ready.emit());
  }
}
