import { AfterViewInit } from '@angular/core';
import { AudioState } from '#mm/state/component';
import { ChangeDetectionStrategy } from '@angular/core';
import { ClearStatus } from '#mm/state/status';
import { Component } from '@angular/core';
import { ComponentState } from '#mm/state/component';
import { ComponentStateModel } from '#mm/state/component';
import { ContentChildren } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Output } from '@angular/core';
import { QueryList } from '@angular/core';
import { SetComponentState } from '#mm/state/component';
import { SetStatus } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { WatchableEventEmitter } from '#mm/utils';
import { WaveSurferOptions } from 'wavesurfer.js';
import { WaveSurferPlugin } from '#mm/components/wavesurfer-plugin';
import { WaveSurferPluginComponent } from '#mm/components/wavesurfer-plugin';
import { Working } from '#mm/state/status';

import { inject } from '@angular/core';
import { kebabasize } from '#mm/utils';

import deepCopy from 'deep-copy';
import WaveSurfer from 'wavesurfer.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-wavesurfer',
  template: `
    <figure>
      <article #wave></article>

      <ng-content />

      <nav>
        <audio
          #media
          (ratechange)="onAudioChange({ playbackRate: media.playbackRate })"
          (volumechange)="
            onAudioChange({ muted: media.muted, volume: media.volume })
          "
          [muted]="componentState.audio.muted"
          [playbackRate]="componentState.audio.playbackRate"
          [volume]="componentState.audio.volume"
          controls></audio>

        <button
          (click)="onSkip(-10)"
          appearance="mono"
          icon="tuiIconCornerUpLeft"
          size="xs"
          tuiIconButton
          type="button"></button>

        <input
          #zoomer
          (input)="onZoom(zoomer.valueAsNumber)"
          [value]="componentState.wavesurfer.minPxPerSec"
          max="100"
          min="1"
          type="range" />

        <button
          (click)="onSkip(+10)"
          appearance="mono"
          icon="tuiIconCornerUpRight"
          size="xs"
          tuiIconButton
          type="button"></button>
      </nav>
    </figure>
  `,
  styles: [
    `
      figure {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 0.5rem 0 0 0;

        > * {
          width: 100%;
        }

        audio {
          flex: 2;
          height: 2rem;
        }

        nav {
          align-items: center;
          display: flex;
          flex-direction: row;
          gap: 0.25rem;
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
  @ViewChild('zoomer') zoomer: ElementRef<HTMLInputElement>;

  @ContentChildren(WaveSurferPluginComponent)
  plugins$: QueryList<WaveSurferPluginComponent>;

  /* eslint-enable @typescript-eslint/member-ordering */

  componentState: ComponentStateModel;
  wavesurfer: WaveSurfer;

  #audioFile: string;
  #options: Partial<WaveSurferOptions> = {};
  #store = inject(Store);

  constructor() {
    // 👇 initialize the component state
    this.componentState = deepCopy(
      this.#store.selectSnapshot<ComponentStateModel>(ComponentState)
    );
  }

  @Input() get audioFile(): string {
    return this.#audioFile;
  }

  @Input() get options(): Partial<WaveSurferOptions> {
    return this.#options;
  }

  set audioFile(audioFile: string) {
    this.#audioFile = audioFile;
    if (this.wavesurfer && this.#audioFile) this.#loadAudioFile();
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
      minPxPerSec: this.componentState.wavesurfer.minPxPerSec,
      plugins: this.plugins$.map((plugin: WaveSurferPlugin) => plugin.create()),
      progressColor: '#c0c0c0',
      waveColor: '#880e4f', // 👈 --tui-accent
      ...this.options
    });
    // 👇 load the audio file
    if (this.#audioFile) this.#loadAudioFile();
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

  onAudioChange(changes: Partial<AudioState>): void {
    const state = { ...this.componentState.audio, ...changes };
    this.#store.dispatch(new SetComponentState({ audio: state }));
  }

  onSkip(secsToSkip: number): void {
    this.wavesurfer.setTime(this.wavesurfer.getCurrentTime() + secsToSkip);
  }

  onZoom(minPxPerSec: number): void {
    this.wavesurfer.zoom(minPxPerSec);
    const state = { ...this.componentState.wavesurfer, minPxPerSec };
    this.#store.dispatch(new SetComponentState({ wavesurfer: state }));
  }

  #loadAudioFile(): void {
    const working = new Working('audio');
    this.#store.dispatch(
      new SetStatus({
        status: 'Loading audio into player',
        working
      })
    );
    try {
      this.wavesurfer.once('ready', () => {
        // 👇 set the media state
        //    NOTE: can't set the playback rate until audio is loaded!
        const audio = this.media.nativeElement;
        audio.playbackRate = this.componentState.audio.playbackRate;
        this.#store.dispatch(new ClearStatus(working));
      });
      this.wavesurfer.load(this.#audioFile);
    } catch (error) {
      this.#store.dispatch(new SetStatus({ error }));
    }
  }
}
