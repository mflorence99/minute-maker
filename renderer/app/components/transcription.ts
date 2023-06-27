import { AgendaItem } from '#mm/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Constants } from '#mm/common';
import { Input } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { Transcription } from '#mm/common';
import { UpdateAgendaItem } from '#mm/state/minutes';
import { UpdateTranscription } from '#mm/state/minutes';

import { debounce } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { objectsHaveSameKeys } from '#mm/utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { withPreviousItem } from '#mm/utils';

import dayjs from 'dayjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-transcription',
  template: `
    <article>
      <table>
        <tbody>
          <tr
            *ngFor="let tx of transcription; let ix = index; trackBy: trackByTx"
            (click)="txIndex = ix">
            <td [ngClass]="{ current: ix === txIndex }" class="marker">
              <fa-icon
                [fixedWidth]="true"
                [icon]="['fas', 'triangle']"
                [rotate]="90" />
            </td>

            <ng-container *ngIf="tx.type === 'AG'">
              <td class="title" colspan="3">
                <textarea
                  #agendaItemTitle
                  (input)="
                    updateAgendaItem({ title: agendaItemTitle.value }, ix)
                  "
                  [value]="tx.title"
                  autocomplete="off"
                  autocorrect="on"
                  class="title"
                  rows="1"
                  spellcheck="true"
                  wrap="off"></textarea>
              </td>
            </ng-container>

            <ng-container *ngIf="tx.type === 'TX'">
              <td class="start">{{ makeStartTime(tx.start) }}</td>
              <td>
                <input
                  #transcriptionSpeaker
                  (input)="
                    updateTranscription(
                      { speaker: transcriptionSpeaker.value },
                      ix
                    )
                  "
                  [value]="tx.speaker"
                  list="transcriptionSpeakers" />
              </td>
              <td class="speech">
                <textarea
                  #transcriptionSpeech
                  (input)="
                    updateTranscription(
                      { speech: transcriptionSpeech.value },
                      ix
                    )
                  "
                  [value]="tx.speech"
                  autocomplete="off"
                  autocorrect="on"
                  autosize
                  class="speech"
                  spellcheck="true"
                  wrap="soft"></textarea>
              </td>
            </ng-container>
          </tr>
        </tbody>
      </table>
    </article>

    <datalist id="transcriptionSpeakers">
      <option value="Tom"></option>
      <option value="Dick"></option>
      <option value="Harry"></option>
    </datalist>
  `,
  styles: [
    `
      article {
        border: 1px dotted;
        height: 100%;
        overflow-y: scroll;
        width: 100%;
      }

      input {
        background-color: var(--background-color);
        border: none;
        color: var(--text-color);
        font-family: inherit;
        font-weight: bold;
        width: 7rem;
      }

      table {
        border-collapse: collapse;
        width: 100%;
      }

      td {
        padding: 4px;
      }

      td.marker {
        color: var(--accent-color);
        opacity: 0;
        transition: opacity 0.5s;

        &.current {
          opacity: 1;
        }
      }

      td.speech,
      td.title {
        width: 100%;
      }

      td.start {
        font-family: monospace;
        white-space: nowrap;
      }

      tr {
        vertical-align: top;
      }

      tr:not(:last-child) {
        border-bottom: 1px dotted;
      }

      textarea {
        background-color: var(--background-color);
        border: none;
        color: var(--text-color);
        font-family: inherit;
        resize: none;
        width: 100%;
      }

      textarea.speech {
        height: 100%;
      }

      textarea.title {
        font-size: larger;
        font-weight: bold;
        height: 1.125rem;
        overflow: hidden;
        text-transform: uppercase;
      }
    `
  ]
})
export class TranscriptionComponent {
  @Input({ required: true }) startDate: Date;
  @Input({ required: true }) transcription: (AgendaItem | Transcription)[];

  txIndex = 0;

  #store = inject(Store);
  #updateBuffer$ = new Subject<UpdateAgendaItem | UpdateTranscription>();

  constructor() {
    // 👇 all this to make sure that when we switch rows, we don't debounce
    this.#updateBuffer$
      .pipe(
        takeUntilDestroyed(),
        withPreviousItem<UpdateAgendaItem | UpdateTranscription>(),
        debounce(({ previous, current }) =>
          !previous ||
          previous.ix !== current.ix ||
          !objectsHaveSameKeys(previous, current)
            ? timer(0)
            : timer(Constants.editDebounceTime)
        ),
        map(({ current }) => current)
      )
      .subscribe((action) => this.#store.dispatch(action));
  }

  makeStartTime(seconds: number): string {
    return seconds != null
      ? dayjs(this.startDate).add(seconds, 'second').format('hh:mm:ssa')
      : '';
  }

  trackByTx(ix, tx: AgendaItem | Transcription): number {
    return tx.id;
  }

  updateAgendaItem(update: any, ix: number): void {
    const action = new UpdateAgendaItem(update, ix);
    this.#updateBuffer$.next(action);
  }

  updateTranscription(update: any, ix: number): void {
    const action = new UpdateTranscription(update, ix);
    this.#updateBuffer$.next(action);
  }
}
