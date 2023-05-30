import { Component } from '@angular/core';

@Component({
  selector: 'mm-root',
  template: `
    <main>
      <mm-wavesurfer [audioFile]="'./assets/minutes.mp3'">
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
