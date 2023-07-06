import { AgendaItem } from '#mm/common';
import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
import { CancelTranscription } from '#mm/state/app';
import { Component } from '@angular/core';
import { InsertAgendaItem } from '#mm/state/minutes';
import { JoinTranscriptions } from '#mm/state/minutes';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { NewMinutes } from '#mm/state/app';
import { Observable } from 'rxjs';
import { OpenMinutes } from '#mm/state/app';
import { RecentsState } from '#mm/state/recents';
import { Redo } from '#mm/state/undo';
import { RemoveTranscription } from '#mm/state/minutes';
import { RephraseTranscription } from '#mm/state/app';
import { SaveMinutes } from '#mm/state/app';
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
import { Undo } from '#mm/state/undo';

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
          [startDate]="date"
          [transcription]="transcription$ | async" />

        <mm-summary [summary]="summary$ | async" />

        <section class="buttons">
          <button (click)="openMinutes()" appearance="primary" tuiButton>
            Open Minutes
          </button>
          <button (click)="newMinutes()" appearance="secondary" tuiButton>
            New Minutes
          </button>
          <button
            (click)="saveMinutes()"
            appearance="secondary-destructive"
            tuiButton>
            Save Minutes
          </button>
          <button (click)="exporter.export()" appearance="accent" tuiButton>
            Export
          </button>
        </section>

        <section class="buttons">
          <button (click)="transcribe()" appearance="outline" tuiButton>
            Transcribe Minutes
          </button>
          <button
            (click)="cancelTranscription()"
            appearance="outline"
            tuiButton>
            Cancel Transcription
          </button>
          <button (click)="summarizeMinutes()" appearance="outline" tuiButton>
            Summarize Minutes
          </button>
        </section>

        <section class="buttons">
          <button
            (click)="rephraseTranscription()"
            appearance="outline"
            tuiButton>
            Rephrase #{{ txIndex }}
          </button>
          <button (click)="splitTranscription()" appearance="outline" tuiButton>
            Split #{{ txIndex }}
          </button>
          <button (click)="joinTranscriptions()" appearance="outline" tuiButton>
            Join #{{ txIndex }}
          </button>
          <button
            (click)="removeTranscription()"
            appearance="outline"
            tuiButton>
            Remove #{{ txIndex }}
          </button>
          <button (click)="insertAgendaItem()" appearance="outline" tuiButton>
            Agenda #{{ txIndex }}
          </button>
        </section>

        <section class="buttons">
          <button
            (click)="redo()"
            icon="tuiIconCornerUpRightLarge"
            tuiIconButton></button>
          <button
            (click)="undo()"
            icon="tuiIconCornerUpLeftLarge"
            tuiIconButton></button>
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

      <mm-exporter #exporter />
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
  @Select(MinutesState.summary) summary$: Observable<Summary[]>;
  @Select(MinutesState.transcription) transcription$: Observable<
    (AgendaItem | Transcription)[]
  >;

  date = new Date();

  txIndex = 0;

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

  newMinutes(): void {
    this.#store.dispatch(new NewMinutes());
  }

  openMinutes(): void {
    this.#store.dispatch(new OpenMinutes());
  }

  redo(): void {
    this.#store.dispatch(new Redo());
  }

  removeTranscription(): void {
    this.#store.dispatch(new RemoveTranscription(this.txIndex));
  }

  rephraseTranscription(): void {
    this.#store.dispatch(new RephraseTranscription('accuracy', this.txIndex));
  }

  saveMinutes(): void {
    this.#store.dispatch(new SaveMinutes());
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

  undo(): void {
    this.#store.dispatch(new Undo());
  }
}
