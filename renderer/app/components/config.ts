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
import { Validators } from '@angular/forms';

import { inject } from '@angular/core';
import { tuiMarkControlAsTouchedAndValidate } from '@taiga-ui/cdk';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-config',
  template: `
    <form [formGroup]="configForm">
      <label tuiLabel="Credentials">
        <tui-text-area
          formControlName="googleCredentials"
          spellcheck="false"
          style="font-family: monospace; font-size: 12px; line-height: 1.25">
          Google Application JSON
        </tui-text-area>
        <tui-error
          formControlName="googleCredentials"
          [error]="[] | tuiFieldError | async"></tui-error>
      </label>

      <label tuiLabel="">
        <tui-input formControlName="openaiCredentials" spellcheck="false">
          Open AI Key
          <input style="font-family: monospace; font-size: 12px" tuiTextfield />
        </tui-input>
        <tui-error
          formControlName="openaiCredentials"
          [error]="[] | tuiFieldError | async"></tui-error>
      </label>

      <tui-input formControlName="bucketName">
        Audio File Bucket Name
        <input tuiTextfield />
      </tui-input>

      <article class="row" formGroupName="rephraseStrategyPrompts">
        <label tuiLabel="Transcription rephrase strategy for accuracy">
          <tui-text-area [expandable]="true" formControlName="accuracy" />
        </label>
        <label tuiLabel="... for brevity">
          <tui-text-area [expandable]="true" formControlName="brevity" />
        </label>
      </article>

      <article class="row" formGroupName="summaryStrategyPrompts">
        <label tuiLabel="Transcription summary strategy as bullet points">
          <tui-text-area [expandable]="true" formControlName="bullets" />
        </label>
        <label tuiLabel="... into paragraphs">
          <tui-text-area [expandable]="true" formControlName="paragraphs" />
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
    const credentialsValidator = (field): Validators => {
      return field.value
        ? null
        : { required: 'These credentials must be supplied' };
    };
    // 👇 create the form
    this.configForm = new FormGroup({
      bucketName: new FormControl(this.config.bucketName),
      googleCredentials: new FormControl(this.config.googleCredentials, [
        Validators.required,
        credentialsValidator
      ]),
      openaiCredentials: new FormControl(this.config.openaiCredentials, [
        Validators.required,
        credentialsValidator
      ]),
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
    // 👇 mark the critical required fields invalid right away
    tuiMarkControlAsTouchedAndValidate(this.configForm);
    // 👇 watch for changes and update accordingly
    this.configForm.valueChanges.subscribe((changes) =>
      this.#bufferedDispatcher.dispatch(new UpdateChanges(changes))
    );
  }
}
