import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
import { CancelTranscription } from '#mm/state/app';
import { Component } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { NewMinutes } from '#mm/state/app';
import { Observable } from 'rxjs';
import { OpenAIService } from '#mm/services/openai';
import { OpenMinutes } from '#mm/state/app';
import { RecentsState } from '#mm/state/recents';
import { SaveMinutes } from '#mm/state/app';
import { Select } from '@ngxs/store';
import { SetMinutes } from '#mm/state/minutes';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { TranscribeMinutes } from '#mm/state/app';
import { Transcription } from '#mm/common';

import { inject } from '@angular/core';

@Component({
  selector: 'mm-root',
  template: `
    <main>
      <header>{{ (app$ | async).pathToMinutes }}</header>
      <mm-wavesurfer
        [audioFile]="audioURL$ | async"
        [options]="{ barGap: 2, barRadius: 2, barWidth: 2 }">
        <mm-wavesurfer-timeline></mm-wavesurfer-timeline>
      </mm-wavesurfer>

      <mm-transcription
        [startDate]="date"
        [transcription]="transcription$ | async" />

      <section class="buttons">
        <button (click)="openMinutes()" color="primary" mat-raised-button>
          Open Minutes
        </button>
        <button (click)="newMinutes()" color="accent" mat-raised-button>
          New Minutes
        </button>
        <button (click)="saveMinutes()" color="warn" mat-raised-button>
          Save Minutes
        </button>
        <button (click)="transcribe()" mat-raised-button>
          Transcribe Minutes
        </button>
        <button (click)="cancelTranscription()" mat-raised-button>
          Cancel Transcription
        </button>
        <button (click)="chatCompletion()" mat-raised-button>AI Minutes</button>
      </section>

      <ul class="recents">
        <li *ngFor="let minutes$ of recentMinutes$ | async">
          <ng-container *ngIf="minutes$ | async as minutes">
            <p>{{ minutes.title }}</p>
          </ng-container>
        </li>
      </ul>

      <footer>{{ (status$ | async).status }}</footer>
    </main>
  `,
  styles: [
    `
      main {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        height: 100%;
        justify-content: center;

        mm-transcription {
          height: 320px;
          width: 480px;
        }

        mm-wavesurfer {
          width: 480px;
        }

        .buttons {
          display: flex;
          flex-flow: row wrap;
          gap: 2rem;
          justify-content: center;
        }
      }
    `
  ]
})
export class RootPage {
  @Select(AppState) app$: Observable<AppStateModel>;
  @Select(MinutesState.audioURL) audioURL$: Observable<string>;
  @Select(RecentsState.minutes) recentMinutes$: Observable<
    Observable<Minutes>[]
  >;
  @Select(StatusState) status$: Observable<StatusStateModel>;
  @Select(MinutesState.transcription) transcription$: Observable<
    Transcription[]
  >;

  date = new Date();

  #openai = inject(OpenAIService);
  #store = inject(Store);

  constructor() {
    this.status$.subscribe(console.log);
  }

  cancelTranscription(): void {
    this.#store.dispatch(new CancelTranscription());
  }

  chatCompletion(): void {
    const minutes = this.#store.selectSnapshot(MinutesState);
    if (minutes?.transcription.length > 0) {
      this.#openai
        .chatCompletion({
          prompt: `Summarize my statement in the first person:\n\n${minutes.transcription[0].speech}`
        })
        .then(console.log);
    }
  }

  newMinutes(): void {
    this.#store.dispatch(new NewMinutes());
  }

  openMinutes(): void {
    this.#store.dispatch(new OpenMinutes());
  }

  saveMinutes(): void {
    this.#store.dispatch(new SaveMinutes());
  }

  transcribe(): void {
    // 🔥 hack until we can edit the minutes
    this.#store.dispatch(new SetMinutes({ speakers: ['AOH'] }));
    this.#store.dispatch(new TranscribeMinutes());
  }
}
