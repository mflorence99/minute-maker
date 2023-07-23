import { BufferedDispatcherService } from '#mm/services/buffered-dispatcher';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfigStateModel } from '#mm/state/config';
import { FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { OnInit } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { UpdateChanges } from '#mm/state/config';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-config',
  template: `
    <form [formGroup]="configForm">
      <tui-input formControlName="bucketName">
        Audio File Bucket Name
        <input tuiTextfield />
      </tui-input>

      <article class="row" formGroupName="rephraseStrategyPrompts">
        <label tuiLabel="Transcription rephrase strategy for accuracy">
          <tui-text-area formControlName="accuracy" [expandable]="true" />
        </label>
        <label tuiLabel="... for brevity">
          <tui-text-area formControlName="brevity" [expandable]="true" />
        </label>
      </article>

      <article class="row" formGroupName="summaryStrategyPrompts">
        <label tuiLabel="Transcription summary strategy as bullet points">
          <tui-text-area formControlName="bullets" [expandable]="true" />
        </label>
        <label tuiLabel="... into paragraphs">
          <tui-text-area formControlName="paragraphs" [expandable]="true" />
        </label>
      </article>
    </form>
  `
})
export class ConfigComponent implements OnChanges, OnInit {
  @Input({ required: true }) config: ConfigStateModel;

  configForm: FormGroup;

  #bufferedDispatcher = inject(BufferedDispatcherService);

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange))
      this.configForm.setValue({ ...this.config }, { emitEvent: false });
  }

  ngOnInit(): void {
    // 👇 create the form
    this.configForm = new FormGroup({
      bucketName: new FormControl(this.config.bucketName),
      rephraseStrategyPrompts: new FormGroup({
        accuracy: new FormControl(this.config.rephraseStrategyPrompts.accuracy),
        brevity: new FormControl(this.config.rephraseStrategyPrompts.brevity)
      }),
      summaryStrategyPrompts: new FormGroup({
        bullets: new FormControl(this.config.summaryStrategyPrompts.bullets),
        paragraphs: new FormControl(
          this.config.summaryStrategyPrompts.paragraphs
        )
      })
    });
    // 👇 watch for changes and update accordingly
    this.configForm.valueChanges.subscribe((changes) =>
      this.#bufferedDispatcher.dispatch(new UpdateChanges(changes))
    );
  }
}
