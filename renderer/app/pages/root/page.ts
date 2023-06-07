import { Component } from '@angular/core';
import { OpenAIService } from '#mm/services/openai';
import { TranscriberService } from '#mm/services/transcriber';

import { inject } from '@angular/core';

@Component({
  selector: 'mm-root',
  template: `
    <main>
      <mm-wavesurfer
        [audioFile]="'./assets/short.mp3'"
        [options]="{ barGap: 2, barRadius: 2, barWidth: 2 }">
        <mm-wavesurfer-regions
          (regionEntered)="event('region-entered', $event)">
          <mm-wavesurfer-region
            [params]="{ start: 30, end: 40, color: 'red' }" />
        </mm-wavesurfer-regions>
        <mm-wavesurfer-timeline
          (ready)="event('timeline-ready', $event)"></mm-wavesurfer-timeline>
      </mm-wavesurfer>
      <button (click)="transcribe()" color="primary" mat-raised-button>
        Transcribe
      </button>
    </main>
  `
})
export class RootPage {
  #openai = inject(OpenAIService);
  #transcriber = inject(TranscriberService);

  event(key, event): void {
    console.log(key, event);
  }

  transcribe(): void {
    const request = {
      audio: {
        encoding: 'MP3',
        gcsuri: 'gs://washington-app-319514.appspot.com/short.mp3',
        sampleRateHertz: 32000
      },
      date: '2023-05-02T09:36',
      title: 'Zoning Board of Adjustment',
      speakers: ['Fred'],
      subtitle: 'Meeting Minutes Test',
      subject: 'Test Minutes'
    };

    this.#transcriber.transcribe(request).subscribe(console.log);
  }
}
