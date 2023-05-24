import { CSSVariableProxy } from '../utils';
import { WatchableEventEmitter } from '../utils';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';

import { kebabasize } from '../utils';

import { AfterContentInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { MarkerParams } from 'wavesurfer.js/dist/plugin/wavesurfer.markers.min.js';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';
import { QueryList } from '@angular/core';
import { WaveSurferParams } from 'wavesurfer.js/types/params';

import { combineLatest } from 'rxjs';
import { inject } from '@angular/core';
import { startWith } from 'rxjs';

import WaveSurfer from 'wavesurfer.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-wavesurfer',
  template: `<ng-content />`
})
export class WaveSurferComponent
  implements AfterContentInit, OnDestroy, OnInit
{
  /* eslint-disable @typescript-eslint/member-ordering */

  @Output() audioprocess = new WatchableEventEmitter<number>();
  @Output() dblclick = new WatchableEventEmitter<Event>();
  @Output() destroy = new WatchableEventEmitter<void>();
  @Output() error = new WatchableEventEmitter<string>();
  @Output() finish = new WatchableEventEmitter<void>();
  @Output() interaction = new WatchableEventEmitter<Event>();
  @Output() loading = new WatchableEventEmitter<number>();
  @Output() markerClick = new WatchableEventEmitter<MarkerParams>();
  @Output() markerContextmenu = new WatchableEventEmitter<MarkerParams>();
  @Output() markerDrag = new WatchableEventEmitter<MarkerParams>();
  @Output() markerDrop = new WatchableEventEmitter<MarkerParams>();
  @Output() mute = new WatchableEventEmitter<boolean>();
  @Output() pause = new WatchableEventEmitter<void>();
  @Output() play = new WatchableEventEmitter<void>();
  @Output() ready = new WatchableEventEmitter<void>();
  @Output() scroll = new WatchableEventEmitter<Event>();
  @Output() seek = new WatchableEventEmitter<number>();
  @Output() volume = new WatchableEventEmitter<number>();
  @Output() waveformReady = new WatchableEventEmitter<void>();
  @Output() zoom = new WatchableEventEmitter<number>();

  @Input() params: Partial<WaveSurferParams> = {};

  @ContentChildren(WaveSurferPluginComponent)
  plugins$: QueryList<WaveSurferPluginComponent>;

  /* eslint-enable @typescript-eslint/member-ordering */

  wavesurfer: WaveSurfer;

  #audioFile: string;
  #host: HTMLElement = inject(ElementRef).nativeElement;
  #proxy = new CSSVariableProxy<WaveSurferParams>(this.#host);
  #ready$ = new BehaviorSubject<boolean>(false);

  @Input() get audioFile(): string {
    return this.#audioFile;
  }

  set audioFile(fn: string) {
    this.#audioFile = fn;
    if (this.wavesurfer) this.wavesurfer.load(this.#audioFile);
  }

  ngOnDestroy(): void {
    this.wavesurfer.destroy();
  }

  ngOnInit(): void {
    // 👇 create the WaveSurfer
    this.wavesurfer = new WaveSurfer({
      container: this.#host,
      ...this.params
    });
    // 👇 need to know when WaveSurfer is ready
    this.wavesurfer.on('ready', () => this.#ready$.next(true));
    // 👇 initialize the WaveSurfer with a proxy of its params
    if (this.wavesurfer['params'])
      this.wavesurfer['params'] = this.#proxy.proxyFactory(
        'wavesurfer',
        this.wavesurfer['params']
      );
    this.wavesurfer.init();
    // 👇 load the audio file
    if (this.#audioFile) this.wavesurfer.load(this.#audioFile);
    // 👇 bind any events
    Object.getOwnPropertyNames(this)
      .filter(
        (prop) =>
          this[prop] instanceof WatchableEventEmitter &&
          this[prop].subscriberCount > 0
      )
      .forEach((prop) => {
        this.wavesurfer.on(kebabasize(prop), (args) => this[prop].emit(args));
      });
  }

  ngAfterContentInit(): void {
    combineLatest([
      this.plugins$.changes.pipe(startWith(this.plugins$)),
      this.#ready$
    ]).subscribe(([list, ready]) => {
      if (ready) {
        // 👇 create a PluginDefinition for every component
        const plugins = list.map((comp) => comp.create());
        // 👇 destroy all the plugins that are not in the list
        const current = Object.keys(this.wavesurfer.getActivePlugins());
        const changed = new Set(plugins.map((plugin) => plugin.name));
        const difference = current.filter((x) => !changed.has(x));
        difference.forEach((name) => this.wavesurfer.destroyPlugin(name));
        // 👇 add and initialize each pluginwith a proxy of its params
        plugins.forEach((plugin) => {
          this.wavesurfer.addPlugin(plugin);
          if (this.wavesurfer[plugin.name]?.['params'])
            this.wavesurfer[plugin.name]['params'] = this.#proxy.proxyFactory(
              `wavesurfer-${plugin.name}`,
              this.wavesurfer[plugin.name]['params']
            );
          this.wavesurfer.initPlugin(plugin.name);
        });
      }
    });
  }
}
