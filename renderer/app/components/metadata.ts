import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Input } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { OnInit } from '@angular/core';
import { SetMinutes } from '#mm/state/minutes';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-metadata',
  template: `
    <form [formGroup]="metadata">
      <tui-input formControlName="title">
        Meeting Title
        <input tuiTextfield />
      </tui-input>

      <tui-input formControlName="subject">
        Meeting Subject
        <input tuiTextfield />
      </tui-input>

      <tui-input-date-time formControlName="date">
        Meeting Date and Time
        <input tuiTextfield />
      </tui-input-date-time>
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
      }
    `
  ]
})
export class MetadataComponent implements OnInit {
  @Input({ required: true }) minutes: Minutes;

  metadata: FormGroup;

  #minutesState = inject(MinutesState);

  ngOnInit(): void {
    this.metadata = new FormGroup({
      date: new FormControl(this.minutes.date),
      subject: new FormControl(this.minutes.subject),
      title: new FormControl(this.minutes.title)
    });
    //
    this.metadata.valueChanges.subscribe((update) =>
      this.#minutesState.updateBuffer$.next(new SetMinutes(update))
    );
  }
}
