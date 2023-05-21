import { WatchableEventEmitter } from '../utils';

import { kebabasize } from '../utils';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';
import { WaveSurferParams } from 'wavesurfer.js/types/params';

import { inject } from '@angular/core';

import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import WaveSurfer from 'wavesurfer.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-wavesurfer',
  templateUrl: './wavesurfer.html',
  styleUrls: ['./wavesurfer.scss']
})
export class WaveSurferComponent implements OnInit {
  @Output() audioprocess = new WatchableEventEmitter<string>();
  @Output() ready = new WatchableEventEmitter<string>();
  @Output() zoom = new WatchableEventEmitter<string>();

  // eslint-disable-next-line @typescript-eslint/member-ordering
  @Input() options: Partial<WaveSurferParams> = {};

  wavesurfer: WaveSurfer;

  #audioFile: string;
  #host: ElementRef;

  constructor() {
    this.#host = inject(ElementRef);
  }

  @Input() get audioFile(): string {
    return this.#audioFile;
  }

  set audioFile(fn: string) {
    this.#audioFile = fn;
    if (this.wavesurfer) this.wavesurfer.load(this.#audioFile);
  }

  ngOnInit(): void {
    this.wavesurfer = WaveSurfer.create({
      container: this.#host.nativeElement,
      plugins: [RegionsPlugin.create({})],
      ...this.options
    });
    Object.getOwnPropertyNames(this)
      .filter((prop) => this[prop] instanceof WatchableEventEmitter)
      .forEach((prop) => {
        this.wavesurfer.on(kebabasize(prop), (args) => this[prop].emit(args));
      });
    if (this.#audioFile) this.wavesurfer.load(this.#audioFile);
  }
}
