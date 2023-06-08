import { Component } from '@angular/core';
import { OpenAIService } from '#mm/services/openai';
import { TranscriberService } from '#mm/services/transcriber';
import { UploaderService } from '#mm/services/uploader';

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

      <article class="buttons">
        <button (click)="transcribe()" color="primary" mat-raised-button>
          Transcribe
        </button>
        <button (click)="upload()" color="accent" mat-raised-button>
          Upload
        </button>
        <button (click)="listModels()" color="warn" mat-raised-button>
          List Models
        </button>
      </article>
    </main>
  `
})
export class RootPage {
  #openai = inject(OpenAIService);
  #transcriber = inject(TranscriberService);
  #uploader = inject(UploaderService);

  event(key, event): void {
    console.log(key, event);
  }

  listModels(): void {
    this.#openai.listModels().then(console.log);
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

  upload(): void {
    const request = {
      bucketName: 'staging.washington-app-319514.appspot.com',
      destFileName: 'test.mp3',
      filePath: '/home/mflo/mflorence99/minute-maker/renderer/assets/short.mp3'
    };
    this.#uploader.upload(request);
  }
}
