import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { GenericPlugin } from 'wavesurfer.js/dist/base-plugin';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';
import { TimelinePluginOptions } from 'wavesurfer.js/dist/plugins/timeline';
import { WatchableEventEmitter } from '#mm/utils';
import { WaveSurferPlugin } from '#mm/components/wavesurfer-plugin';
import { WaveSurferPluginComponent } from '#mm/components/wavesurfer-plugin';

import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { kebabasize } from '#mm/utils';

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
  @Output() ready = new WatchableEventEmitter<void>();

  options = input<Partial<TimelinePluginOptions>>({});
  plugin: TimelinePlugin;

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
    // 👇 bind any events
    Object.getOwnPropertyNames(this)
      .filter(
        (prop) =>
          this[prop] instanceof WatchableEventEmitter &&
          this[prop].subscriberCount > 0
      )
      .forEach((prop) => {
        this.plugin.on(kebabasize(prop), (args) => this[prop].emit(args));
      });
  }
}
