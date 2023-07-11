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

            <td class="summary">
              <header *ngIf="summ.section">{{ summ.section }}</header>

              <textarea
                #summText
                (input)="updateSummary({ summary: summText.value }, ix)"
                [value]="summ.summary"
                autocomplete="off"
                autocorrect="on"
                autosize
                spellcheck="true"
                wrap="soft"></textarea>
            </td>
          </tr>
        </tbody>
      </table>
    </tui-scrollbar>
  `,
  styles: [
    `
      header {
        font-size: larger;
        font-weight: bold;
        height: 1.75rem;
        overflow: hidden;
      }

      table {
        border-collapse: collapse;
        width: 100%;
      }

      td {
        padding: 0.25rem;
      }

      td.summary {
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
        height: 100%;
        resize: none;
        width: 100%;
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
