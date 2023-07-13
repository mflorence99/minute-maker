import { AgendaItem } from '#mm/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { MinutesState } from '#mm/state/minutes';
import { Observable } from 'rxjs';
import { Output } from '@angular/core';
import { Select } from '@ngxs/store';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Transcription } from '#mm/common';
import { UpdateAgendaItem } from '#mm/state/minutes';
import { UpdateTranscription } from '#mm/state/minutes';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-transcription',
  template: `
    <table *ngIf="status$ | async as status">
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
            <td colspan="2" width="100%">
              <textarea
                #agendaItemTitle
                (input)="updateAgendaItem({ title: agendaItemTitle.value }, ix)"
                [mmRemovable]="ix"
                [value]="tx.title"
                autocomplete="off"
                autocorrect="on"
                class="heading"
                rows="1"
                spellcheck="true"
                style="width: calc(100% - 1rem)"
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
                [value]="tx.speaker"
                style="font-weight: bold; width: 7rem" />
            </td>

            <td width="100%">
              <tui-loader
                [showLoader]="
                  status.working === 'rephrase' && status.ix === ix
                ">
                <textarea
                  #transcriptionSpeech
                  (input)="
                    updateTranscription(
                      { speech: transcriptionSpeech.value },
                      ix
                    )
                  "
                  [class.disabled]="
                    status.working === 'rephrase' && status.ix === ix
                  "
                  [mmInsertable]="ix"
                  [mmJoinable]="
                    transcription[ix + 1]?.type === 'TX' ? ix : null
                  "
                  [mmRephraseable]="ix"
                  [mmSplittable]="ix"
                  [value]="tx.speech"
                  autocomplete="off"
                  autocorrect="on"
                  autosize
                  spellcheck="true"
                  style="width: calc(100% - 1rem)"
                  wrap="soft"></textarea>
              </tui-loader>
            </td>
          </ng-container>
        </tr>
      </tbody>
    </table>
  `
})
export class TranscriptionComponent {
  @Output() selected = new EventEmitter<number>();

  @Select(StatusState) status$: Observable<StatusStateModel>;

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
