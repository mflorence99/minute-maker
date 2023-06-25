import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
import { CancelTranscription } from '#mm/state/app';
import { Component } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { NewMinutes } from '#mm/state/app';
import { Observable } from 'rxjs';
import { OpenMinutes } from '#mm/state/app';
import { RecentsState } from '#mm/state/recents';
import { Redo } from '#mm/state/minutes';
import { RephraseTranscription } from '#mm/state/app';
import { SaveMinutes } from '#mm/state/app';
import { Select } from '@ngxs/store';
import { SetMinutes } from '#mm/state/minutes';
import { SplitTranscription } from '#mm/state/minutes';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { TranscribeMinutes } from '#mm/state/app';
import { Transcription } from '#mm/common';
import { Undo } from '#mm/state/minutes';

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
        <button (click)="rephraseTranscription()" mat-raised-button>
          Rephrase Transcription
        </button>

        <button (click)="splitTranscription()" mat-raised-button>
          Split Transcription
        </button>

        <button (click)="redo()" mat-icon-button>
          <fa-icon [icon]="['fad', 'redo']" size="2x"></fa-icon>
        </button>
        <button (click)="undo()" mat-icon-button>
          <fa-icon [icon]="['fad', 'undo']" size="2x"></fa-icon>
        </button>
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
          width: 440px;
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

  #store = inject(Store);

  constructor() {
    this.status$.subscribe(console.log);
  }

  cancelTranscription(): void {
    this.#store.dispatch(new CancelTranscription());
  }

  newMinutes(): void {
    this.#store.dispatch(new NewMinutes());
  }

  openMinutes(): void {
    this.#store.dispatch(new OpenMinutes());
  }

  redo(): void {
    this.#store.dispatch(new Redo());
  }

  rephraseTranscription(): void {
    this.#store.dispatch(new RephraseTranscription('accuracy', 0));
  }

  saveMinutes(): void {
    this.#store.dispatch(new SaveMinutes());
  }

  splitTranscription(): void {
    // 🔥 hack until we can edit the minutes
    this.#store.dispatch(new SplitTranscription(0, 25));
  }

  transcribe(): void {
    // 🔥 hack until we can edit the minutes
    this.#store.dispatch(new SetMinutes({ speakers: ['AOH'] }));
    this.#store.dispatch(new TranscribeMinutes());
  }

  undo(): void {
    this.#store.dispatch(new Undo());
  }
}
