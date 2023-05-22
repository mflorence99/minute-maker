import { WatchableEventEmitter } from '../utils';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';

import { kebabasize } from '../utils';

import { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { MarkerParams } from 'wavesurfer.js/dist/plugin/wavesurfer.markers.min.js';
import { OnDestroy } from '@angular/core';
import { Output } from '@angular/core';
import { QueryList } from '@angular/core';
import { WaveSurferParams } from 'wavesurfer.js/types/params';

import { inject } from '@angular/core';

import WaveSurfer from 'wavesurfer.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-wavesurfer',
  template: ` <ng-content />`,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column-reverse;
      }
    `
  ]
})
export class WaveSurferComponent implements OnDestroy, AfterViewInit {
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
  plugins: QueryList<WaveSurferPluginComponent>;

  /* eslint-enable @typescript-eslint/member-ordering */

  wavesurfer: WaveSurfer;

  #audioFile: string;
  #host: ElementRef = inject(ElementRef);

  @Input() get audioFile(): string {
    return this.#audioFile;
  }

  set audioFile(fn: string) {
    this.#audioFile = fn;
    if (this.wavesurfer) this.wavesurfer.load(this.#audioFile);
  }

  ngOnDestroy(): void {
    this.wavesurfer.unAll();
  }

  // 👉 AfterViewInit is AFTER AfterContentInit
  ngAfterViewInit(): void {
    // 👇 create the WaveSurfer
    this.wavesurfer = WaveSurfer.create({
      container: this.#host.nativeElement,
      plugins: (this.plugins ?? []).map((plugin) => plugin.create()),
      ...this.params
    });
    // 👇 bind any events
    Object.getOwnPropertyNames(this)
      .filter((prop) => this[prop] instanceof WatchableEventEmitter)
      .forEach((prop) => {
        this.wavesurfer.on(kebabasize(prop), (args) => this[prop].emit(args));
      });
    // 👇 load the audio file
    if (this.#audioFile) this.wavesurfer.load(this.#audioFile);
  }
}
