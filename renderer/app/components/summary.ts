import { BufferedDispatcherService } from '#mm/services/buffered-dispatcher';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ControllerService } from '#mm/services/controller';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { Output } from '@angular/core';
import { StatusStateModel } from '#mm/state/status';
import { Summary } from '#mm/common';
import { SummaryStrategy } from '#mm/common';
import { UpdateSummary } from '#mm/state/minutes';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-summary',
  template: `
    <table *ngIf="summary.length > 0; else noSummary">
      <tbody>
        <tr
          *ngFor="let summ of summary; let ix = index; trackBy: trackByIx"
          (click)="selected.emit((summIndex = ix))"
          [ngClass]="{ selected: ix === summIndex }">
          <td width="100%">
            <div *ngIf="summ.section" class="heading">
              {{ summ.section }}
            </div>

            <textarea
              #summText
              (input)="updateSummary({ summary: summText.value }, ix)"
              [useImportant]="true"
              [value]="summ.summary"
              autocomplete="off"
              autocorrect="on"
              autosize
              spellcheck="true"
              style="width: calc(100% - 1rem)"
              wrap="soft"></textarea>
          </td>
        </tr>
      </tbody>
    </table>

    <ng-template #noSummary>
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

        <tui-loader [showLoader]="status.working?.on === 'summary'">
          <button
            (click)="summarizeMinutes('bullets')"
            [appearance]="status.working?.on === 'summary' ? 'mono' : 'primary'"
            size="m"
            tuiButton>
            Summarize Transcription into Bullet Points
          </button>

          <button
            (click)="summarizeMinutes('paragraphs')"
            [appearance]="status.working?.on === 'summary' ? 'mono' : 'accent'"
            size="m"
            tuiButton>
            Summarize Transcription into Paragraphs
          </button>
        </tui-loader>
      </tui-block-status>
    </ng-template>
  `
})
export class SummaryComponent {
  @Output() selected = new EventEmitter<number>();

  @Input({ required: true }) status: StatusStateModel;
  @Input({ required: true }) summary: Summary[];

  summIndex = 0;

  #bufferedDispatcher = inject(BufferedDispatcherService);
  #controller = inject(ControllerService);

  summarizeMinutes(summaryStrategy: SummaryStrategy): void {
    this.#controller.summarizeMinutes(summaryStrategy);
  }

  // 🔥 can't insert/remove summaries
  trackByIx(ix: number): number {
    return ix;
  }

  updateSummary(update: any, ix: number): void {
    const action = new UpdateSummary(update, ix);
    this.#bufferedDispatcher.dispatch(action);
  }
}
