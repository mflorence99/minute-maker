import { Component } from '@angular/core';

@Component({
  selector: 'mm-root',
  template: `
    <main>
      <mm-wavesurfer
        [audioFile]="'./assets/minutes.mp3'"
        [options]="{ barGap: 2, barRadius: 2, barWidth: 2 }">
        <mm-wavesurfer-regions>
          <mm-wavesurfer-region
            [params]="{ start: 30, end: 40, color: 'red' }" />
        </mm-wavesurfer-regions>
        <mm-wavesurfer-timeline
          (ready)="xxx('time-line-ready', $event)"></mm-wavesurfer-timeline>
      </mm-wavesurfer>
    </main>
  `
})
export class RootPage {
  xxx(key, event): void {
    console.log(key, event);
  }
}
