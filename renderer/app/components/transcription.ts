import { AgendaItem } from '#mm/common';
import { BufferedDispatcherService } from '#mm/services/buffered-dispatcher';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ControllerService } from '#mm/services/controller';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { Minutes } from '#mm/common';
import { Output } from '@angular/core';
import { StatusStateModel } from '#mm/state/status';
import { Transcription } from '#mm/common';
import { UpdateAgendaItem } from '#mm/state/minutes';
import { UpdateTranscription } from '#mm/state/minutes';
import { WINDOW } from '@ng-web-apis/common';

import { inject } from '@angular/core';

import dayjs from 'dayjs';
import scrollIntoView from 'scroll-into-view-if-needed';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-transcription',
  template: `
    <table *ngIf="minutes.transcription.length > 0; else noTranscription">
      <tbody>
        <ng-container
          *ngFor="
            let tx of minutes.transcription;
            let ix = index;
            trackBy: trackByTx
          ">
          <tr
            #row="hydrated"
            (click)="onSelected(tx)"
            [mmHydrated]="'TX' + tx.id"
            [ngClass]="{ selected: tx.id === currentTx?.id }"
            [id]="'TX' + tx.id">
            <ng-container *ngIf="tx.type === 'AG'">
              <td colspan="3" width="100%">
                <textarea
                  #agendaItemTitle
                  (input)="
                    updateAgendaItem({ title: agendaItemTitle.value }, ix)
                  "
                  [mmRemovable]="ix"
                  [value]="tx.title"
                  autocomplete="off"
                  autocorrect="on"
                  autosize
                  class="heading"
                  spellcheck="true"
                  style="width: calc(100% - 1rem)"
                  wrap="soft"></textarea>
              </td>
            </ng-container>

            <ng-container *ngIf="tx.type === 'TX' && row.isHydrated">
              <td
                style="font-family: monospace; font-size: smaller; padding-top: 0.15rem">
                {{
                  dayjs({ second: tx.start }).format(
                    duration > 60 * 60 ? 'HH:mm:ss' : 'mm:ss'
                  )
                }}
              </td>
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
                    status.working?.on === 'rephrase' && status.ix === ix
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
                      status.working?.on === 'rephrase' && status.ix === ix
                    "
                    [mmInsertable]="ix"
                    [mmJoinable]="
                      minutes.transcription[ix + 1]?.type === 'TX' ? ix : null
                    "
                    [mmRephraseable]="ix"
                    [mmSplittable]="ix"
                    [useImportant]="true"
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
        </ng-container>
      </tbody>
    </table>

    <ng-template #noTranscription>
      <tui-block-status>
        <img tuiSlot="top" src="./assets/meeting.png" />

        <h4>
          The audio file has not yet
          <br />
          been transcribed ...
        </h4>

        <p>
          It can be re-transcribed later from the
          <b>Run</b>
          menu.
        </p>

        <tui-loader [showLoader]="status.working?.on === 'transcription'">
          <button
            (click)="transcribeAudio()"
            [appearance]="
              status.working?.on === 'transcription' ? 'mono' : 'primary'
            "
            size="m"
            tuiButton>
            Transcribe Audio
          </button>
        </tui-loader>
      </tui-block-status>
    </ng-template>
  `
})
export class TranscriptionComponent {
  /* eslint-disable @typescript-eslint/member-ordering */

  @Input({ required: true }) duration: number;
  @Input({ required: true }) minutes: Minutes;
  @Input({ required: true }) status: StatusStateModel;

  @Output() selected = new EventEmitter<Transcription>();

  /* eslint-enable @typescript-eslint/member-ordering */

  dayjs = dayjs;

  #bufferedDispatcher = inject(BufferedDispatcherService);
  #controller = inject(ControllerService);
  #currentTx: Transcription;
  #window = inject(WINDOW);

  @Input() get currentTx(): Transcription {
    return this.#currentTx;
  }

  set currentTx(currentTx: Transcription) {
    this.#currentTx = currentTx;
    if (currentTx) {
      const row = this.#window.document.querySelector(`#TX${currentTx.id}`);
      if (row)
        scrollIntoView(row, {
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest',
          scrollMode: 'if-needed'
        });
    }
  }

  onSelected(tx: AgendaItem | Transcription): void {
    if (tx.type === 'TX') this.selected.emit(tx);
  }

  trackByTx(ix, tx: AgendaItem | Transcription): number {
    return tx.id;
  }

  transcribeAudio(): void {
    this.#controller.transcribeAudio();
  }

  updateAgendaItem(update: any, ix: number): void {
    const action = new UpdateAgendaItem(update, ix);
    this.#bufferedDispatcher.dispatch(action);
  }

  updateTranscription(update: any, ix: number): void {
    const action = new UpdateTranscription(update, ix);
    this.#bufferedDispatcher.dispatch(action);
  }
}
