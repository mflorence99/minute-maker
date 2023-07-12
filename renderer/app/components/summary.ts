import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { MinutesState } from '#mm/state/minutes';
import { Output } from '@angular/core';
import { Summary } from '#mm/common';
import { UpdateSummary } from '#mm/state/minutes';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-summary',
  template: `
    <tui-scrollbar>
      <table>
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
              <header *ngIf="summ.section" class="heading">
                {{ summ.section }}
              </header>

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
    </tui-scrollbar>
  `
})
export class SummaryComponent {
  @Output() selected = new EventEmitter<number>();

  @Input({ required: true }) summary: Summary[];

  summIndex = 0;

  #minutesState = inject(MinutesState);

  // 🔥 can't insert/remove summaries
  trackByIx(ix: number): number {
    return ix;
  }

  updateSummary(update: any, ix: number): void {
    const action = new UpdateSummary(update, ix);
    this.#minutesState.updateBuffer$.next(action);
  }
}
