import { Component } from '@angular/core';
import { FSService } from '#mm/services/fs';
import { LoadMinutes } from '#mm/state/app';
import { MetadataService } from '#mm/services/metadata';
import { OpenAIService } from '#mm/services/openai';
import { Store } from '@ngxs/store';
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

      <mm-transcription
        [startDate]="date"
        [transcription]="[
          { speaker: 'Bob', start: 0, speech: 'Hello' },
          { speaker: 'Fred', start: 66, speech: 'Goodbye' }
        ]" />

      <article class="buttons">
        <button (click)="transcribe()" color="primary" mat-raised-button>
          Transcribe
        </button>
        <button (click)="upload()" color="accent" mat-raised-button>
          Upload
        </button>
        <button (click)="chatCompletion()" color="warn" mat-raised-button>
          Chat Completion
        </button>
      </article>

      <article class="buttons">
        <button (click)="openFile()" mat-raised-button>Open File</button>
        <button (click)="saveFileAs()" mat-raised-button>Save File</button>
        <button (click)="metadata()" mat-raised-button>Metadata</button>
      </article>
    </main>
  `
})
export class RootPage {
  date = new Date();

  #fs = inject(FSService);
  #metadata = inject(MetadataService);
  #openai = inject(OpenAIService);
  #store = inject(Store);
  #transcriber = inject(TranscriberService);
  #uploader = inject(UploaderService);

  chatCompletion(): void {
    this.#openai
      .chatCompletion({
        prompt: `Convert this into grammatical English: \n\n I no work no more`
      })
      .then(console.log);
  }

  event(key, event): void {
    console.log(key, event);
  }

  metadata(): void {
    this.#metadata
      .parseFile(
        '/home/mflo/mflorence99/minute-maker/renderer/assets/minutes.mp3'
      )
      .then(console.log);
  }

  openFile(): void {
    this.#store.dispatch(new LoadMinutes());
  }

  saveFileAs(): void {
    this.#fs
      .saveFileAs('data', {
        defaultPath: '/home/mflo/mflorence99/minute-maker/temp',
        filters: [{ extensions: ['txt'], name: 'Crap files' }],
        title: 'My Save File As'
      })
      .then(console.log);
  }

  transcribe(): void {
    const request = {
      audio: {
        encoding: 'MP3',
        gcsuri: 'gs://washington-app-319514.appspot.com/short.mp3',
        sampleRateHertz: 22100
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
