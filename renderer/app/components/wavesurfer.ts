import { AfterViewInit } from '@angular/core';
import { AudioState } from '#mm/state/component';
import { ChangeDetectionStrategy } from '@angular/core';
import { ClearStatus } from '#mm/state/status';
import { Component } from '@angular/core';
import { ComponentState } from '#mm/state/component';
import { ComponentStateModel } from '#mm/state/component';
import { ElementRef } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { SetComponentState } from '#mm/state/component';
import { SetStatus } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { WaveSurferOptions } from 'wavesurfer.js';
import { WaveSurferPlugin } from '#mm/components/wavesurfer-plugin';
import { WaveSurferPluginComponent } from '#mm/components/wavesurfer-plugin';
import { Working } from '#mm/state/status';

import { contentChildren } from '@angular/core';
import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { output } from '@angular/core';
import { viewChild } from '@angular/core';

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
  audioFile = input<string>();
  audioFileLoaded = output<HTMLAudioElement>();
  audioprocess = output<number>();
  click = output<number>();
  componentState: ComponentStateModel;
  decode = output<number>();
  destroy = output<void>();
  drag = output<number>();
  finish = output<void>();
  interaction = output<void>();
  load = output<string>();
  media = viewChild<ElementRef<HTMLMediaElement>>('media');
  options = input<Partial<WaveSurferOptions>>({});
  pause = output<void>();
  play = output<void>();
  plugins = contentChildren(WaveSurferPluginComponent);
  ready = output<number>();
  redraw = output<void>();
  scroll = output<number>();
  seeking = output<number>();
  timeupdate = output<number>();
  wave = viewChild<ElementRef<HTMLElement>>('wave');
  wavesurfer: WaveSurfer;
  zoom = output<number>();

  #store = inject(Store);

  constructor() {
    // 👇 initialize the component state
    this.componentState = deepCopy(
      this.#store.selectSnapshot<ComponentStateModel>(ComponentState)
    );
    // 👇 handle changes in audioFile
    effect(() => {
      if (this.wavesurfer && this.audioFile()) this.#loadAudioFile();
    });
    // 👇 handle changes in options
    effect(() => {
      if (this.wavesurfer) this.wavesurfer.setOptions(this.options());
    });
  }

  // 👇 ngAfterViewInit FOLLOWS ngAfterContentInit
  //    and BOTH have to be satisfied for this to work
  ngAfterViewInit(): void {
    // 👇 create the WaveSurfer
    this.wavesurfer = WaveSurfer.create({
      backend: 'WebAudio',
      container: this.wave().nativeElement,
      media: this.media().nativeElement,
      minPxPerSec: this.componentState.wavesurfer.minPxPerSec,
      plugins: this.plugins().map((plugin: WaveSurferPlugin) =>
        plugin.create()
      ),
      progressColor: '#c0c0c0',
      waveColor: '#8bc34a', // 👈 --tui-accent
      ...this.options()
    });
    // 👇 bind to events
    this.wavesurfer.on('audioprocess', (args) => this.audioprocess.emit(args));
    this.wavesurfer.on('click', (args) => this.click.emit(args));
    this.wavesurfer.on('decode', (args) => this.decode.emit(args));
    this.wavesurfer.on('destroy', () => this.destroy.emit());
    this.wavesurfer.on('drag', (args) => this.drag.emit(args));
    this.wavesurfer.on('finish', () => this.finish.emit());
    this.wavesurfer.on('interaction', () => this.interaction.emit());
    this.wavesurfer.on('load', (args) => this.load.emit(args));
    this.wavesurfer.on('pause', () => this.pause.emit());
    this.wavesurfer.on('play', () => this.play.emit());
    this.wavesurfer.on('ready', (args) => this.ready.emit(args));
    this.wavesurfer.on('redraw', () => this.redraw.emit());
    this.wavesurfer.on('scroll', (args) => this.scroll.emit(args));
    this.wavesurfer.on('seeking', (args) => this.seeking.emit(args));
    this.wavesurfer.on('timeupdate', (args) => this.timeupdate.emit(args));
    this.wavesurfer.on('zoom', (args) => this.zoom.emit(args));
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
    this.wavesurfer.once('ready', () => {
      // 👇 set the media state
      //    NOTE: can't set the playback rate until audio is loaded!
      const audio = this.media().nativeElement;
      audio.playbackRate = this.componentState.audio.playbackRate;
      this.#store.dispatch(new ClearStatus(working));
      // 👇 tell the world we're loaded
      this.audioFileLoaded.emit(audio);
    });
    this.wavesurfer.load(this.audioFile());
  }
}
