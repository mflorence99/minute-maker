import { OpenAIService } from '../../services/open-ai';

import { Component } from '@angular/core';

import { inject } from '@angular/core';

@Component({
  selector: 'mm-root',
  template: `
    <main>
      <mm-wavesurfer
        [audioFile]="'./assets/minutes.mp3'"
        [options]="{ barGap: 2, barRadius: 2, barWidth: 2 }">
        <mm-wavesurfer-regions (regionEntered)="xxx('region-entered', $event)">
          <mm-wavesurfer-region
            [params]="{ start: 30, end: 40, color: 'red' }" />
        </mm-wavesurfer-regions>
        <mm-wavesurfer-timeline
          (ready)="xxx('timeline-ready', $event)"></mm-wavesurfer-timeline>
      </mm-wavesurfer>
    </main>
  `
})
export class RootPage {
  #openai = inject(OpenAIService);

  xxx(key, event): void {
    console.log(key, event);
  }
}
