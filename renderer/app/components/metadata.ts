import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Input } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { OnChanges } from '@angular/core';
import { OnInit } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { UpdateDetails } from '#mm/state/minutes';
import { Validators } from '@angular/forms';

import { emptyMinutes } from '#mm/common';
import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-metadata',
  template: `
    <form [formGroup]="metadata">
      <tui-input formControlName="title">
        Title
        <input tuiTextfield />
      </tui-input>

      <tui-input formControlName="subtitle">
        Subtitle
        <input tuiTextfield />
      </tui-input>

      <tui-input formControlName="subject">
        Subject
        <input tuiTextfield />
      </tui-input>

      <article class="row">
        <tui-input-date-time formControlName="date">
          Date and Time
          <input tuiTextfield />
        </tui-input-date-time>

        <tui-input-number formControlName="numSpeakers" [min]="1">
          Number of Speakers
        </tui-input-number>
      </article>

      <ng-container
        *ngFor="
          let inputTag of [
            ['Members Present', 'present'],
            ['Members Absent', 'absent'],
            ['Visitors', 'visitors']
          ]
        ">
        <label [tuiLabel]="inputTag[0]">
          <tui-input-tag
            mmDragDroppable
            [formControlName]="inputTag[1]"
            [tuiHintContent]="'Separate name, title etc with a dash'"
            [tuiTextfieldLabelOutside]="true"></tui-input-tag>
        </label>
      </ng-container>
    </form>
  `,
  styles: [
    `
      form {
        background-color: var(--tui-info-bg);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;

        .row {
          display: flex;
          flex-direction: row;
          gap: 1rem;

          * > {
            flex-grow: 1;
          }
        }
      }
    `
  ]
})
export class MetadataComponent implements OnChanges, OnInit {
  @Input({ required: true }) minutes: Minutes;

  metadata: FormGroup;

  #minutesState = inject(MinutesState);

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      const dflt = emptyMinutes();
      this.metadata.setValue(
        {
          absent: this.minutes.absent ?? dflt.absent,
          date: this.minutes.date ?? dflt.date,
          numSpeakers: this.minutes.numSpeakers || dflt.numSpeakers,
          present: this.minutes.present ?? dflt.present,
          subject: this.minutes.subject ?? dflt.subject,
          subtitle: this.minutes.subtitle ?? dflt.subtitle,
          title: this.minutes.title ?? dflt.title,
          visitors: this.minutes.visitors ?? dflt.visitors
        },
        { emitEvent: false }
      );
    }
  }

  ngOnInit(): void {
    // 👇 create the form
    this.metadata = new FormGroup({
      absent: new FormControl(this.minutes.absent),
      date: new FormControl(this.minutes.date, Validators.required),
      numSpeakers: new FormControl(
        this.minutes.numSpeakers || this.minutes.present?.length || 1,
        Validators.required
      ),
      present: new FormControl(this.minutes.present),
      subject: new FormControl(this.minutes.subject),
      subtitle: new FormControl(this.minutes.subtitle),
      title: new FormControl(this.minutes.title, Validators.required),
      visitors: new FormControl(this.minutes.visitors)
    });
    // 👇 watch for changes and update accordingly
    this.metadata.valueChanges.subscribe((details) =>
      this.#minutesState.updateBuffer$.next(new UpdateDetails(details))
    );
  }
}
