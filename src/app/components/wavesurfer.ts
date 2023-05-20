import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { OnInit } from '@angular/core';

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
  wavesurfer: WaveSurfer;
  #host: ElementRef;

  constructor() {
    this.#host = inject(ElementRef);
  }

  ngOnInit(): void {
    this.wavesurfer = WaveSurfer.create({
      container: this.#host.nativeElement,
      plugins: [RegionsPlugin.create({})]
    });
    this.wavesurfer.load('./assets/minutes.mp3');
  }
}
