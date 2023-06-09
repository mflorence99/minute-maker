import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Transcription } from '#mm/common';

import dayjs from 'dayjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-transcription',
  template: `
    <table>
      <tbody>
        <tr
          *ngFor="let tx of transcription; let ix = index; trackBy: trackByTx"
          (click)="txIndex = ix">
          <td [ngClass]="{ current: ix === txIndex }" class="marker">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'triangle']"
              [rotate]="90" />
          </td>
          <td class="start">{{ makeStartTime(tx.start) }}</td>
          <td class="speaker">{{ tx.speaker }}</td>
          <td class="speech">{{ tx.speech }}</td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [
    `
      table {
        border-collapse: collapse;
        width: 100%;
      }

      td {
        padding: 4px;
      }

      td.marker {
        color: var(--accent-color);
        opacity: 0;
        transition: opacity 0.5s;

        &.current {
          opacity: 1;
        }
      }

      td.speaker {
        font-weight: bold;
        white-space: nowrap;
      }

      td.speech {
        width: 100%;
      }

      td.start {
        font-family: monospace;
        font-size: smaller;
        white-space: nowrap;
      }

      tr {
        border: 1px dotted;
      }
    `
  ]
})
export class TranscriptionComponent {
  @Input({ required: true }) startDate: Date;
  @Input({ required: true }) transcription: Transcription[];

  txIndex = 0;

  makeStartTime(seconds: number): string {
    return dayjs(this.startDate).add(seconds, 'second').format('hh:mm:ssa');
  }

  trackByTx(ix, tx: Transcription): string {
    return `${tx.speaker}-${tx.start}`;
  }
}
