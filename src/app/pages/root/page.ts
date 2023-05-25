import { WaveSurferComponent } from '../../components/wavesurfer';

import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'mm-root',
  template: `
    <main>
      <mm-wavesurfer
        #wavesurfer
        (regionIn)="xxx($event)"
        [audioFile]="'./assets/minutes.mp3'"
        [params]="{
          backend: 'MediaElementWebAudio',
          barGap: 2,
          barRadius: 3,
          barWidth: 3,
          scrollParent: true
        }">
        <mm-wavesurfer-cursor [params]="{ opacity: 1, showTime: true }" />
        <mm-wavesurfer-timeline />
      </mm-wavesurfer>

      <button
        (click)="wavesurfer.wavesurfer.playPause()"
        color="primary"
        mat-flat-button>
        Play/Pause
      </button>
    </main>
  `
})
export class RootPage {
  @ViewChild(WaveSurferComponent) wavesurfer: WaveSurferComponent;

  xxx(event): void {
    console.log(event);
  }
}
