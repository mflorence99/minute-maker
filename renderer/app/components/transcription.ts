import { AgendaItem } from '#mm/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { MinutesState } from '#mm/state/minutes';
import { Output } from '@angular/core';
import { Transcription } from '#mm/common';
import { UpdateAgendaItem } from '#mm/state/minutes';
import { UpdateTranscription } from '#mm/state/minutes';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-transcription',
  template: `
    <tui-scrollbar>
      <table>
        <tbody>
          <tr
            *ngFor="let tx of transcription; let ix = index; trackBy: trackByTx"
            (click)="selected.emit((txIndex = ix))">
            <td>
              <tui-svg
                [ngClass]="{ current: ix === txIndex }"
                class="marker"
                src="tuiIconArrowRightLarge" />
            </td>

            <ng-container *ngIf="tx.type === 'AG'">
              <td class="title" colspan="2">
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
              <td>
                <input
                  #transcriptionSpeaker
                  (input)="
                    updateTranscription(
                      { speaker: transcriptionSpeaker.value },
                      ix
                    )
                  "
                  [value]="tx.speaker" />
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
                  [mmRephraseable]="ix"
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
    </tui-scrollbar>
  `,
  styles: [
    `
      input {
        background-color: inherit;
        border: none;
        color: inherit;
        font-family: inherit;
        font-weight: bold;
        width: 7rem;
      }

      table {
        border-collapse: collapse;
        width: 100%;
      }

      td {
        padding: 0.25rem;
      }

      td.speech,
      td.title {
        width: 100%;
      }

      tr {
        vertical-align: top;
      }

      tr:not(:last-child) {
        border-bottom: 1px dotted;
      }

      textarea {
        background-color: inherit;
        border: none;
        color: inherit;
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

      tui-scrollbar {
        border: 1px dotted;
        height: 100%;
        width: 100%;
      }

      tui-svg.marker {
        color: var(--tui-primary);
        opacity: 0;
        transition: opacity 0.5s;

        &.current {
          opacity: 1;
        }
      }
    `
  ]
})
export class TranscriptionComponent {
  @Output() selected = new EventEmitter<number>();

  @Input({ required: true }) transcription: (AgendaItem | Transcription)[];

  txIndex = 0;

  #minutesState = inject(MinutesState);

  trackByTx(ix, tx: AgendaItem | Transcription): number {
    return tx.id;
  }

  updateAgendaItem(update: any, ix: number): void {
    const action = new UpdateAgendaItem(update, ix);
    this.#minutesState.updateBuffer$.next(action);
  }

  updateTranscription(update: any, ix: number): void {
    const action = new UpdateTranscription(update, ix);
    this.#minutesState.updateBuffer$.next(action);
  }
}
