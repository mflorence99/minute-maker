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
import { Summary } from '#mm/common';
import { SummaryStrategy } from '#mm/common';
import { UpdateSummary } from '#mm/state/minutes';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-summary',
  template: `
    <ng-container *ngIf="summary.length > 0; else noSummary">
      <ng-container *ngIf="status$ | async as status">
        <tui-loader [showLoader]="status.working === 'summary'">
          <table>
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
        </tui-loader>
      </ng-container>
    </ng-container>

    <ng-template #noSummary>
      <tui-block-status *ngIf="status$ | async as status">
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

        <tui-loader [showLoader]="status.working === 'summary'">
          <button
            (click)="summarizeMinutes('bullets')"
            [appearance]="status.working === 'summary' ? 'mono' : 'primary'"
            size="m"
            tuiButton>
            Summarize Transcription into Bullet Points
          </button>

          <button
            (click)="summarizeMinutes('paragraphs')"
            [appearance]="status.working === 'summary' ? 'mono' : 'accent'"
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

  @Select(StatusState) status$: Observable<StatusStateModel>;

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
