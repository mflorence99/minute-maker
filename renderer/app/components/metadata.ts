import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Input } from '@angular/core';
import { Minutes } from '#mm/common';
import { OnChanges } from '@angular/core';
import { OnInit } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { UpdateChanges } from '#mm/state/minutes';
import { Validators } from '@angular/forms';

import { emptyMinutes } from '#mm/common';
import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-metadata',
  template: `
    <form [formGroup]="metadata">
      <label tuiLabel="Description">
        <tui-input formControlName="title">
          Title
          <input tuiTextfield />
        </tui-input>
      </label>

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

        <article class="column">
          <tui-input-slider formControlName="numSpeakers" [max]="7" [min]="1">
            Number of Speakers
          </tui-input-slider>
          <span class="hint">
            Necessary for speaker diarization during transcription
          </span>
        </article>
      </article>

      <label tuiLabel="Settings">
        <article class="row">
          <tui-checkbox-block formControlName="hideSpeakerUpdateDialog">
            Hide speaker update dialog
          </tui-checkbox-block>

          <tui-select formControlName="speakerUpdateButton">
            Speaker Update Action
            <input placeholder="Select update action" tuiTextfield />
            <tui-data-list-wrapper
              *tuiDataList
              [items]="speakerUpdateActions"></tui-data-list-wrapper>
          </tui-select>
        </article>
      </label>

      <label tuiLabel="Members Present">
        <tui-input-tag
          mmDragDroppable
          formControlName="present"
          [tuiTextfieldLabelOutside]="true"></tui-input-tag>
      </label>

      <label tuiLabel="Members Absent">
        <tui-input-tag
          mmDragDroppable
          formControlName="absent"
          [tuiTextfieldLabelOutside]="true"></tui-input-tag>
      </label>

      <label tuiLabel="Visitors">
        <article class="column">
          <tui-input-tag
            mmDragDroppable
            formControlName="visitors"
            [tuiTextfieldLabelOutside]="true"></tui-input-tag>
          <span class="hint">
            Separate names from titles etc with a dash and hit ENTER after each
            one
          </span>
        </article>
      </label>
    </form>
  `
})
export class MetadataComponent implements OnChanges, OnInit {
  @Input({ required: true }) minutes: Minutes;

  metadata: FormGroup;

  speakerUpdateActions = ['Change all speakers', 'Change only one'];

  #store = inject(Store);

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      const dflt = emptyMinutes();
      this.metadata.setValue(
        {
          absent: this.minutes.absent ?? dflt.absent,
          date: this.minutes.date ?? dflt.date,
          hideSpeakerUpdateDialog:
            this.minutes.hideSpeakerUpdateDialog ??
            dflt.hideSpeakerUpdateDialog,
          numSpeakers: this.minutes.numSpeakers || dflt.numSpeakers,
          present: this.minutes.present ?? dflt.present,
          speakerUpdateButton:
            this.speakerUpdateActions[this.minutes.speakerUpdateButton],
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
      hideSpeakerUpdateDialog: new FormControl(
        this.minutes.hideSpeakerUpdateDialog
      ),
      numSpeakers: new FormControl(
        this.minutes.numSpeakers || this.minutes.present?.length || 1,
        Validators.required
      ),
      present: new FormControl(this.minutes.present),
      speakerUpdateButton: new FormControl(
        this.speakerUpdateActions[this.minutes.speakerUpdateButton]
      ),
      subject: new FormControl(this.minutes.subject),
      subtitle: new FormControl(this.minutes.subtitle),
      title: new FormControl(this.minutes.title, Validators.required),
      visitors: new FormControl(this.minutes.visitors)
    });
    // 👇 watch for changes and update accordingly
    this.metadata.valueChanges.subscribe((details) =>
      this.#store.dispatch(
        new UpdateChanges({
          ...details,
          speakerUpdateButton: this.speakerUpdateActions.indexOf(
            details.speakerUpdateButton
          )
        })
      )
    );
  }
}
