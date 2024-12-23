import { AgendaItem } from '#mm/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ControllerService } from '#mm/services/controller';
import { DialogService } from '#mm/services/dialog';
import { FindReplaceMatch } from '#mm/components/find-replace';
import { Minutes } from '#mm/common';
import { SetMinutes } from '#mm/state/minutes';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { Transcription } from '#mm/common';
import { UpdateAgendaItem } from '#mm/state/minutes';
import { UpdateSpeakers } from '#mm/state/minutes';
import { UpdateTranscription } from '#mm/state/minutes';
import { WINDOW } from '@ng-web-apis/common';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { output } from '@angular/core';
import { pluckTranscription } from '#mm/state/minutes';

import dayjs from 'dayjs';
import scrollIntoView from 'scroll-into-view-if-needed';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-transcription',
  template: `
    @if (minutes().transcription.length > 0) {
      <!-- 🔥 breathing room for hydration  -->
      <table style="margin-bottom: 50vh">
        <tbody>
          @for (tx of minutes().transcription; track tx.id; let ix = $index) {
            <tr
              #row="hydrated"
              (click)="onSelected(tx)"
              [mmHydrated]="'TX' + tx.id"
              [ngClass]="{ selected: tx.id === currentTx()?.id }"
              [id]="'TX' + tx.id">
              @if (tx.type === 'AG' && row.isHydrated()) {
                <td colspan="3" width="100%">
                  <textarea
                    #agendaItemTitle
                    (input.throttled)="
                      updateAgendaItem(agendaItemTitle.value, ix)
                    "
                    [mmFindReplaceMatchFld]="'title'"
                    [mmFindReplaceMatchID]="tx.id"
                    [mmFindReplaceMatch]="match()"
                    [mmHighlight]="searchString()"
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
              }
              @if (tx.type === 'TX' && row.isHydrated()) {
                <td
                  style="font-family: monospace; font-size: smaller; padding-top: 0.15rem">
                  {{
                    dayjs({ second: tx.start }).format(
                      minutes().audio.duration > 60 * 60 ? 'HH:mm:ss' : 'mm:ss'
                    )
                  }}
                </td>
                <td>
                  <input
                    #transcriptionSpeaker
                    (change)="updateSpeaker(transcriptionSpeaker.value, ix)"
                    [mmFindReplaceMatchFld]="'speaker'"
                    [mmFindReplaceMatchID]="tx.id"
                    [mmFindReplaceMatch]="match()"
                    [mmHighlight]="searchString()"
                    [value]="tx.speaker"
                    style="font-weight: bold; width: 7rem" />
                </td>

                <td width="100%">
                  <tui-loader
                    [showLoader]="
                      status().working?.on === 'rephrase' && status().ix === ix
                    ">
                    <textarea
                      #transcriptionSpeech
                      (input.throttled)="
                        updateSpeech(transcriptionSpeech.value, ix)
                      "
                      [class.disabled]="
                        status().working?.on === 'rephrase' &&
                        status().ix === ix
                      "
                      [mmFindReplaceMatchFld]="'speech'"
                      [mmFindReplaceMatchID]="tx.id"
                      [mmFindReplaceMatch]="match()"
                      [mmHighlight]="searchString()"
                      [mmInsertable]="ix"
                      [mmJoinable]="
                        minutes().transcription[ix + 1]?.type === 'TX'
                          ? ix
                          : null
                      "
                      [mmRephraseable]="ix"
                      [mmRemovable]="ix"
                      [mmSplittable]="ix"
                      [useImportant]="true"
                      [value]="tx.speech"
                      autocomplete="off"
                      autocorrect="on"
                      autosize
                      spellcheck="true"
                      style="left: 1px; position: relative; top: 1px; width: calc(100% - 1rem)"
                      wrap="soft"></textarea>
                  </tui-loader>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    } @else {
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

        <tui-loader [showLoader]="status().working?.on === 'transcription'">
          <button
            (click)="transcribeAudio()"
            [appearance]="
              status().working?.on === 'transcription' ? 'mono' : 'primary'
            "
            size="m"
            tuiButton>
            Transcribe Audio
          </button>
        </tui-loader>
      </tui-block-status>
    }
  `
})
export class TranscriptionComponent {
  currentTx = input<Partial<Transcription>>();
  dayjs = dayjs;
  match = input.required<FindReplaceMatch>();
  minutes = input.required<Minutes>();
  selected = output<Transcription>();
  status = input.required<StatusStateModel>();

  #controller = inject(ControllerService);
  #dialog = inject(DialogService);
  #store = inject(Store);
  #window = inject(WINDOW);

  constructor() {
    effect(() => {
      if (this.currentTx()) {
        const row = this.#window.document.querySelector(
          `#TX${this.currentTx().id}`
        );
        if (row)
          scrollIntoView(row, {
            // 👇 smooth won't work for us, as it is too cumbersome to wait
            //    until the scroll -- and hydration -- is complete -- normal
            //    looks better anyway
            // behavior: 'smooth',
            block: 'end',
            inline: 'nearest',
            scrollMode: 'if-needed'
          });
      }
    });
  }

  onSelected(tx: AgendaItem | Transcription): void {
    if (tx.type === 'TX') this.selected.emit(tx);
  }

  searchString(): string {
    return this.minutes().findReplace?.doFind
      ? this.minutes().findReplace?.searchString
      : '';
  }

  transcribeAudio(): void {
    this.#controller.transcribeAudio();
  }

  updateAgendaItem(title: string, ix: number): void {
    this.#store.dispatch(new UpdateAgendaItem({ title }, ix));
  }

  async updateSpeaker(speaker: string, ix: number): Promise<void> {
    const original = pluckTranscription(this.minutes(), ix).speaker;
    // 👇 need to show change dialog?
    //    if original is blank, don't show the dialog because
    //    we will ALWAYS only change this occurrence
    let button = 1; // 👈 safety valve if button doesn't get set
    if (original && !this.minutes().hideSpeakerUpdateDialog) {
      const { checkboxChecked, response } = await this.#dialog.showMessageBox({
        buttons: ['Yes, change all', 'No, just this one'],
        checkboxLabel: `Don't show this message again for these minutes`,
        detail: `If "don't show this message again" is checked, the action will be honored for all future changes to these minutes(). This can be reversed from the details tab.`,
        message: `Change all occurences of "${original}" to "${speaker}" from here onwards?`,
        title: 'Minute Maker',
        type: 'question'
      });
      button = response;
      this.#store.dispatch(
        new SetMinutes({
          hideSpeakerUpdateDialog: checkboxChecked,
          speakerUpdateButton: button
        })
      );
    } else button = this.minutes().speakerUpdateButton;
    // 👇 yes, change all -- but only if the original wasn't blank
    if (original && button === 0)
      this.#store.dispatch(new UpdateSpeakers(original, speaker, ix));
    // 👇 no, just this one
    else this.#store.dispatch(new UpdateTranscription({ speaker }, ix));
  }

  updateSpeech(speech: string, ix: number): void {
    this.#store.dispatch(new UpdateTranscription({ speech }, ix));
  }
}
