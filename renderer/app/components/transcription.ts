import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Transcription } from '#mm/common';

import dayjs from 'dayjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-transcription',
  template: `
    <article>
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
            <td [innerHTML]="asParagraphs(tx.speech)" class="speech"></td>
          </tr>
        </tbody>
      </table>
    </article>
  `,
  styles: [
    `
      article {
        border: 1px dotted;
        height: 100%;
        overflow-y: scroll;
        width: 100%;
      }

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
        white-space: nowrap;
      }

      tr {
        vertical-align: top;
      }

      tr:not(:last-child) {
        border-bottom: 1px dotted;
      }
    `
  ]
})
export class TranscriptionComponent {
  @Input({ required: true }) startDate: Date;
  @Input({ required: true }) transcription: Transcription[];

  txIndex = 0;

  // 🔥 very temporary
  asParagraphs(text: string): string {
    return text.replaceAll('\n\n', '<br><br>');
  }

  makeStartTime(seconds: number): string {
    return seconds != null
      ? dayjs(this.startDate).add(seconds, 'second').format('hh:mm:ssa')
      : '';
  }

  trackByTx(ix, tx: Transcription): string {
    return `${tx.speaker}-${tx.start}`;
  }
}
