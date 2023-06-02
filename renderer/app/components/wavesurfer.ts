import { WatchableEventEmitter } from '../utils';
import { WaveSurferPlugin } from './wavesurfer-plugin';
import { WaveSurferPluginComponent } from './wavesurfer-plugin';

import { kebabasize } from '../utils';

import { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Output } from '@angular/core';
import { QueryList } from '@angular/core';
import { ViewChild } from '@angular/core';
import { WaveSurferOptions } from 'wavesurfer.js';

import WaveSurfer from 'wavesurfer.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-wavesurfer',
  template: `
    <figure>
      <div #wave></div>
      <ng-content />
      <audio #media controls></audio>
    </figure>
  `,
  styles: [
    `
      figure {
        display: flex;
        flex-direction: column;
        gap: 8px;

        > * {
          width: 100%;
        }
      }
    `
  ]
})
export class WaveSurferComponent implements OnDestroy, AfterViewInit {
  /* eslint-disable @typescript-eslint/member-ordering */

  @Output() audioprocess = new WatchableEventEmitter<number>();
  @Output() click = new WatchableEventEmitter<number>();
  @Output() decode = new WatchableEventEmitter<number>();
  @Output() destroy = new WatchableEventEmitter<void>();
  @Output() drag = new WatchableEventEmitter<number>();
  @Output() finish = new WatchableEventEmitter<void>();
  @Output() interaction = new WatchableEventEmitter<void>();
  @Output() load = new WatchableEventEmitter<string>();
  @Output() pause = new WatchableEventEmitter<void>();
  @Output() play = new WatchableEventEmitter<void>();
  @Output() ready = new WatchableEventEmitter<number>();
  @Output() redraw = new WatchableEventEmitter<void>();
  @Output() scroll = new WatchableEventEmitter<Event>();
  @Output() seeking = new WatchableEventEmitter<number>();
  @Output() timeupdate = new WatchableEventEmitter<number>();
  @Output() zoom = new WatchableEventEmitter<number>();

  @ViewChild('media') media: ElementRef<HTMLMediaElement>;
  @ViewChild('wave') wave: ElementRef<HTMLElement>;

  @ContentChildren(WaveSurferPluginComponent)
  plugins$: QueryList<WaveSurferPluginComponent>;

  /* eslint-enable @typescript-eslint/member-ordering */

  wavesurfer: WaveSurfer;

  #audioFile: string;
  #options: Partial<WaveSurferOptions> = {};

  @Input() get audioFile(): string {
    return this.#audioFile;
  }

  @Input() get options(): Partial<WaveSurferOptions> {
    return this.#options;
  }

  set audioFile(audioFile: string) {
    this.#audioFile = audioFile;
    if (this.wavesurfer) this.wavesurfer.load(this.#audioFile);
  }

  set options(options: Partial<WaveSurferOptions>) {
    this.#options = options;
    if (this.wavesurfer) this.wavesurfer.setOptions(this.#options);
  }

  // 👇 ngAfterViewInit FOLLOWS ngAfterContentInit
  //    and BOTH have to be satisfied for this to work
  ngAfterViewInit(): void {
    // 👇 create the WaveSurfer
    this.wavesurfer = WaveSurfer.create({
      container: this.wave.nativeElement,
      media: this.media.nativeElement,
      plugins: this.plugins$.map((plugin: WaveSurferPlugin) => plugin.create()),
      ...this.options
    });
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

  ngOnDestroy(): void {
    this.wavesurfer.destroy();
  }
}
