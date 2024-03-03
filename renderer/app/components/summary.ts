import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ControllerService } from '#mm/services/controller';
import { EventEmitter } from '@angular/core';
import { Minutes } from '#mm/common';
import { Output } from '@angular/core';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { SummaryStrategy } from '#mm/common';
import { UpdateSummary } from '#mm/state/minutes';

import { inject } from '@angular/core';
import { input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-summary',
  template: `
    @if (minutes().summary.length > 0) {
      <!-- 🔥 breathing room for hydration  -->
      <table style="margin-bottom: 50vh">
        <tbody>
          @for (summ of minutes().summary; track ix; let ix = $index) {
            <tr
              #row="hydrated"
              (click)="selected.emit((summIndex = ix))"
              [mmHydrated]="'IX' + ix"
              [ngClass]="{ selected: ix === summIndex }">
              @if (row.isHydrated) {
                <td width="100%">
                  @if (summ.section) {
                    <article class="heading">
                      {{ summ.section }}
                    </article>
                  }

                  <textarea
                    #summText
                    (input.throttled)="
                      updateSummary({ summary: summText.value }, ix)
                    "
                    [useImportant]="true"
                    [value]="summ.summary"
                    autocomplete="off"
                    autocorrect="on"
                    autosize
                    spellcheck="true"
                    style="width: calc(100% - 1rem)"
                    wrap="soft"></textarea>
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
          The transcription has not yet
          <br />
          been summarized ...
        </h4>

        <p>
          It can be re-summarized later from the
          <b>Run</b>
          menu.
        </p>

        <tui-loader [showLoader]="status().working?.on === 'summary'">
          <button
            (click)="summarizeMinutes('bullets')"
            [appearance]="
              status().working?.on === 'summary' ? 'mono' : 'primary'
            "
            size="m"
            tuiButton>
            Summarize Transcription into Bullet Points
          </button>

          <button
            (click)="summarizeMinutes('paragraphs')"
            [appearance]="
              status().working?.on === 'summary' ? 'mono' : 'accent'
            "
            size="m"
            tuiButton>
            Summarize Transcription into Paragraphs
          </button>
        </tui-loader>
      </tui-block-status>
    }
  `
})
export class SummaryComponent {
  @Output() selected = new EventEmitter<number>();

  minutes = input<Minutes>();
  status = input<StatusStateModel>();
  summIndex = 0;

  #controller = inject(ControllerService);
  #store = inject(Store);

  summarizeMinutes(summaryStrategy: SummaryStrategy): void {
    this.#controller.summarizeMinutes(summaryStrategy);
  }

  updateSummary(update: any, ix: number): void {
    this.#store.dispatch(new UpdateSummary(update, ix));
  }
}
