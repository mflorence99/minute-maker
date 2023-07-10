import { AgendaItem } from '#mm/common';
import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
import { CancelTranscription } from '#mm/state/app';
import { Component } from '@angular/core';
import { InsertAgendaItem } from '#mm/state/minutes';
import { JoinTranscriptions } from '#mm/state/minutes';
import { MenuService } from '#mm/services/menu';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { Observable } from 'rxjs';
import { RecentsState } from '#mm/state/recents';
import { RemoveTranscription } from '#mm/state/minutes';
import { RephraseTranscription } from '#mm/state/app';
import { Select } from '@ngxs/store';
import { SetMinutes } from '#mm/state/minutes';
import { SplitTranscription } from '#mm/state/minutes';
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
    <tui-theme-night />
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
            appearance="outline"
            tuiButton
            size="s">
            Transcribe Minutes
          </button>
          <button
            (click)="cancelTranscription()"
            appearance="outline"
            tuiButton
            size="s">
            Cancel Transcription
          </button>
          <button
            (click)="summarizeMinutes()"
            appearance="outline"
            tuiButton
            size="s">
            Summarize Minutes
          </button>
        </section>

        <section class="buttons">
          <button
            (click)="rephraseTranscription()"
            appearance="outline"
            tuiButton
            size="s">
            Rephrase #{{ txIndex }}
          </button>
          <button
            (click)="splitTranscription()"
            appearance="outline"
            tuiButton
            size="s">
            Split #{{ txIndex }}
          </button>
          <button
            (click)="joinTranscriptions()"
            appearance="outline"
            tuiButton
            size="s">
            Join #{{ txIndex }}
          </button>
          <button
            (click)="removeTranscription()"
            appearance="outline"
            tuiButton
            size="s">
            Remove #{{ txIndex }}
          </button>
          <button
            (click)="insertAgendaItem()"
            appearance="outline"
            tuiButton
            size="s">
            Agenda #{{ txIndex }}
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

        mm-summary,
        mm-transcription {
          height: 25rem;
          width: 40rem;
        }

        mm-wavesurfer {
          width: 40rem;
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
  @Select(MinutesState.summary) summary$: Observable<Summary[]>;
  @Select(MinutesState.transcription) transcription$: Observable<
    (AgendaItem | Transcription)[]
  >;

  txIndex = 0;

  #menu = inject(MenuService);
  #store = inject(Store);

  constructor() {
    this.status$.subscribe(console.log);
  }

  cancelTranscription(): void {
    this.#store.dispatch(new CancelTranscription());
  }

  insertAgendaItem(): void {
    this.#store.dispatch(
      new InsertAgendaItem({ title: '--Untitled--' }, this.txIndex)
    );
  }

  joinTranscriptions(): void {
    this.#store.dispatch(new JoinTranscriptions(this.txIndex));
  }

  removeTranscription(): void {
    this.#store.dispatch(new RemoveTranscription(this.txIndex));
  }

  rephraseTranscription(): void {
    this.#store.dispatch(new RephraseTranscription('accuracy', this.txIndex));
  }

  splitTranscription(): void {
    this.#store.dispatch(new SplitTranscription(this.txIndex, 25));
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
