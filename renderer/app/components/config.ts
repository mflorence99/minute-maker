import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfigStateModel } from '#mm/state/config';
import { FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { OnInit } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { UpdateChanges } from '#mm/state/config';
import { Validators } from '@angular/forms';

import { inject } from '@angular/core';
import { tuiMarkControlAsTouchedAndValidate } from '@taiga-ui/cdk';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-config',
  template: `
    <form [formGroup]="configForm">
      <article class="row">
        <label tuiLabel="Transcription implementation">
          <tui-radio-block formControlName="transcriptionImpl" item="google">
            Google
          </tui-radio-block>
          <tui-radio-block
            formControlName="transcriptionImpl"
            item="assemblyai">
            AssemblyAI
          </tui-radio-block>
        </label>

        <label tuiLabel="OpenAI text model">
          <tui-radio-block
            formControlName="openaiChatCompletionModel"
            item="gpt-3.5-turbo-16k"
            style="width: 50%">
            GPT 3.5
          </tui-radio-block>
          <tui-radio-block
            formControlName="openaiChatCompletionModel"
            item="gpt-4-1106-preview"
            style="width: 50%">
            GPT 4
          </tui-radio-block>
        </label>
      </article>

      <article class="row">
        <div></div>

        <tui-input-slider
          formControlName="openaiChatTemperature"
          [max]="2"
          [min]="0"
          [quantum]="0.1">
          Chat Temperature
        </tui-input-slider>
      </article>

      <article class="row">
        <div></div>

        <label tuiLabel="OpenAI image model">
          <tui-radio-block
            formControlName="openaiImageGenerationModel"
            item="dall-e-2"
            style="width: 50%">
            DALL-E 2
          </tui-radio-block>
          <tui-radio-block
            formControlName="openaiImageGenerationModel"
            item="dall-e-3"
            style="width: 50%">
            DALL-E 3
          </tui-radio-block>
        </label>
      </article>

      <label tuiLabel="Credentials">
        <article class="column">
          <tui-text-area
            formControlName="googleCredentials"
            spellcheck="false"
            style="font-family: monospace; font-size: 12px; line-height: 1.25">
            Google Application JSON
          </tui-text-area>
          <tui-error
            formControlName="googleCredentials"
            [error]="[] | tuiFieldError | async"></tui-error>
          <span class="hint">
            Paste the contents of the GCloud credentials JSON file
          </span>
        </article>
      </label>

      <article>
        <tui-input formControlName="bucketName">
          Google Audio File Bucket Name
          <input style="font-family: monospace; font-size: 12px" tuiTextfield />
        </tui-input>
      </article>

      <article>
        <tui-input formControlName="assemblyaiCredentials" spellcheck="false">
          AssemblyAI API Token
          <input style="font-family: monospace; font-size: 12px" tuiTextfield />
        </tui-input>
        <tui-error
          formControlName="assemblyaiCredentials"
          [error]="[] | tuiFieldError | async"></tui-error>
      </article>

      <article>
        <tui-input formControlName="openaiCredentials" spellcheck="false">
          OpenAI Key
          <input style="font-family: monospace; font-size: 12px" tuiTextfield />
        </tui-input>
        <tui-error
          formControlName="openaiCredentials"
          [error]="[] | tuiFieldError | async"></tui-error>
      </article>

      <article>
        <label tuiLabel="Badge generation prompt">
          <tui-text-area
            [expandable]="true"
            formControlName="badgeGenerationPrompt"
            size="m" />
        </label>
      </article>

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

  #store = inject(Store);

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
      assemblyaiCredentials: new FormControl(
        this.config.assemblyaiCredentials,
        [Validators.required, credentialsValidator]
      ),
      badgeGenerationPrompt: new FormControl(this.config.badgeGenerationPrompt),
      bucketName: new FormControl(this.config.bucketName, [
        Validators.required,
        credentialsValidator
      ]),
      googleCredentials: new FormControl(this.config.googleCredentials, [
        Validators.required,
        credentialsValidator
      ]),
      openaiCredentials: new FormControl(this.config.openaiCredentials, [
        Validators.required,
        credentialsValidator
      ]),
      openaiChatCompletionModel: new FormControl(
        this.config.openaiChatCompletionModel
      ),
      openaiChatTemperature: new FormControl(this.config.openaiChatTemperature),
      openaiImageGenerationModel: new FormControl(
        this.config.openaiImageGenerationModel
      ),
      rephraseStrategyPrompts: new FormGroup({
        accuracy: new FormControl(this.config.rephraseStrategyPrompts.accuracy),
        brevity: new FormControl(this.config.rephraseStrategyPrompts.brevity)
      }),
      summaryStrategyPrompts: new FormGroup({
        bullets: new FormControl(this.config.summaryStrategyPrompts.bullets),
        paragraphs: new FormControl(
          this.config.summaryStrategyPrompts.paragraphs
        )
      }),
      transcriptionImpl: new FormControl(this.config.transcriptionImpl)
    });
    // 👇 mark the critical required fields invalid right away
    tuiMarkControlAsTouchedAndValidate(this.configForm);
    // 👇 watch for changes and update accordingly
    this.configForm.valueChanges.subscribe((changes) =>
      this.#store.dispatch(new UpdateChanges(changes))
    );
  }
}
