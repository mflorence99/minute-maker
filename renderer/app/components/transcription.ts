import { AgendaItem } from '#mm/common';
import { BufferedDispatcherService } from '#mm/services/buffered-dispatcher';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ControllerService } from '#mm/services/controller';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Output } from '@angular/core';
import { Select } from '@ngxs/store';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Transcription } from '#mm/common';
import { UpdateAgendaItem } from '#mm/state/minutes';
import { UpdateTranscription } from '#mm/state/minutes';
import { WINDOW } from '@ng-web-apis/common';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-transcription',
  template: `
    <ng-container *ngIf="transcription.length > 0; else noTranscription">
      <ng-container *ngIf="status$ | async as status">
        <tui-loader [showLoader]="status.working === 'transcription'">
          <table>
            <tbody>
              <tr
                *ngFor="
                  let tx of transcription;
                  let ix = index;
                  trackBy: trackByTx
                "
                (click)="onSelected(tx)"
                [ngClass]="{ selected: tx.id === currentTx?.id }"
                [id]="'TX' + tx.id">
                <ng-container *ngIf="tx.type === 'AG'">
                  <td colspan="2" width="100%">
                    <textarea
                      #agendaItemTitle
                      (input)="
                        updateAgendaItem({ title: agendaItemTitle.value }, ix)
                      "
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
        </tui-loader>
      </ng-container>
    </ng-container>

    <ng-template #noTranscription>
      <tui-block-status *ngIf="status$ | async as status">
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

        <tui-loader [showLoader]="status.working === 'transcription'">
          <button
            (click)="transcribeAudio()"
            [appearance]="
              status.working === 'transcription' ? 'mono' : 'primary'
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
  @Output() selected = new EventEmitter<Transcription>();

  @Select(StatusState) status$: Observable<StatusStateModel>;

  @Input({ required: true }) transcription: (AgendaItem | Transcription)[];

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
        row.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
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
