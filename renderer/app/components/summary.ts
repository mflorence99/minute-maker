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
import { Store } from '@ngxs/store';
import { SummarizeMinutes } from '#mm/state/app';
import { Summary } from '#mm/common';
import { SummaryStrategy } from '#mm/common';
import { UpdateSummary } from '#mm/state/minutes';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-summary',
  template: `
    <ng-container *ngIf="status$ | async as status">
      <tui-loader [showLoader]="status.working === 'summary'">
        <table *ngIf="summary.length > 0; else noSummary">
          <tbody>
            <tr
              *ngFor="let summ of summary; let ix = index; trackBy: trackByIx"
              (click)="selected.emit((summIndex = ix))">
              <td>
                <tui-svg
                  [ngClass]="{ current: ix === summIndex }"
                  class="marker"
                  src="tuiIconArrowRightLarge" />
              </td>

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

  #minutesState = inject(MinutesState);
  #store = inject(Store);

  summarizeMinutes(summaryStrategy: SummaryStrategy): void {
    this.#store.dispatch(new SummarizeMinutes(summaryStrategy));
  }

  // 🔥 can't insert/remove summaries
  trackByIx(ix: number): number {
    return ix;
  }

  updateSummary(update: any, ix: number): void {
    const action = new UpdateSummary(update, ix);
    this.#minutesState.updateBuffer$.next(action);
  }
}
