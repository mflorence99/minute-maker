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

      <label tuiLabel="Members Present">
        <tui-input-tag
          formControlName="present"
          tuiHintContent="Separate name, title etc with a dash"
          [tuiTextfieldLabelOutside]="true"></tui-input-tag>
      </label>

      <label tuiLabel="Members Absent">
        <tui-input-tag
          formControlName="absent"
          tuiHintContent="Separate name, title etc with a dash"
          [tuiTextfieldLabelOutside]="true"></tui-input-tag>
      </label>

      <label tuiLabel="Visitors">
        <tui-input-tag
          formControlName="visitors"
          tuiHintContent="Separate name, title etc with a dash"
          [tuiTextfieldLabelOutside]="true"></tui-input-tag>
      </label>
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
    // 👇 keep it simple: there's only one input, and fields in "minutes"
    //    but not in the form will be ignored
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.metadata.patchValue(this.minutes);
    }
  }

  ngOnInit(): void {
    // 👇 create the form
    this.metadata = new FormGroup({
      absent: new FormControl(this.minutes.absent),
      date: new FormControl(this.minutes.date),
      numSpeakers: new FormControl(
        this.minutes.numSpeakers || this.minutes.present?.length || 1
      ),
      present: new FormControl(this.minutes.present),
      subject: new FormControl(this.minutes.subject),
      subtitle: new FormControl(this.minutes.subtitle),
      title: new FormControl(this.minutes.title),
      visitors: new FormControl(this.minutes.visitors)
    });
    // 👇 watch for changes and update accordingly
    this.metadata.valueChanges.subscribe((details) =>
      this.#minutesState.updateBuffer$.next(new UpdateDetails(details))
    );
  }
}
