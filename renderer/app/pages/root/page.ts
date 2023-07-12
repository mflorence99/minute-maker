import { AgendaItem } from '#mm/common';
import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
import { CancelTranscription } from '#mm/state/app';
import { Component } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { Observable } from 'rxjs';
import { RecentsState } from '#mm/state/recents';
import { Select } from '@ngxs/store';
import { SetMinutes } from '#mm/state/minutes';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { SummarizeMinutes } from '#mm/state/app';
import { Summary } from '#mm/common';
import { TranscribeMinutes } from '#mm/state/app';
import { Transcription } from '#mm/common';

import { inject } from '@angular/core';

@Component({
  selector: 'mm-root',
  template: `
    <tui-root>
      <main>
        <header>{{ (app$ | async).pathToMinutes }}</header>
        <mm-wavesurfer
          [audioFile]="audioURL$ | async"
          [options]="{ barGap: 2, barRadius: 2, barWidth: 2 }">
          <mm-wavesurfer-timeline></mm-wavesurfer-timeline>
        </mm-wavesurfer>

        <mm-transcription
          (selected)="txIndex = $event"
          [transcription]="transcription$ | async" />

        <mm-summary [summary]="summary$ | async" />

        <section class="buttons">
          <button
            (click)="transcribe()"
            appearance="primary"
            tuiButton
            size="s">
            Transcribe Minutes
          </button>
          <button
            (click)="cancelTranscription()"
            appearance="secondary"
            tuiButton
            size="s">
            Cancel Transcription
          </button>
          <button
            (click)="summarizeMinutes()"
            appearance="accent"
            tuiButton
            size="s">
            Summarize Minutes
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
    </tui-root>
  `
})
export class RootPage {
  @Select(AppState) app$: Observable<AppStateModel>;
  @Select(MinutesState.audioURL) audioURL$: Observable<string>;
  @Select(RecentsState.minutes) recentMinutes$: Observable<
    Observable<Minutes>[]
  >;
  @Select(StatusState) status$: Observable<StatusStateModel>;
  @Select(MinutesState.summary) summary$: Observable<Summary[]>;
  @Select(MinutesState.transcription) transcription$: Observable<
    (AgendaItem | Transcription)[]
  >;

  txIndex = 0;

  #store = inject(Store);

  constructor() {
    this.status$.subscribe(console.log);
  }

  cancelTranscription(): void {
    this.#store.dispatch(new CancelTranscription());
  }

  summarizeMinutes(): void {
    this.#store.dispatch(new SummarizeMinutes('paragraphs'));
  }

  transcribe(): void {
    // 🔥 TEMPORARY
    this.#store.dispatch(new SetMinutes({ numSpeakers: 4 }));
    this.#store.dispatch(new TranscribeMinutes());
  }
}
