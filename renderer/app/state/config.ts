import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { Observable } from 'rxjs';
import { OpenAIService } from '#mm/services/openai';
import { RephraseStrategy } from '#mm/common';
import { Select } from '@ngxs/store';
import { Selector } from '@ngxs/store';
import { Stack as StackUndoable } from '#mm/state/undo';
import { State } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { SummaryStrategy } from '#mm/common';
import { TranscriberService } from '#mm/services/transcriber';
import { TranscriptionImpl } from '#mm/common';
import { UndoableAction } from '#mm/state/undo';
import { UploaderService } from '#mm/services/uploader';

import { combineLatest } from 'rxjs';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { patch } from '@ngxs/store/operators';
import { pluckOriginalFromChanges } from '#mm/utils';
import { switchMap } from 'rxjs';

import deepCopy from 'deep-copy';
import deepEqual from 'deep-equal';

export class SetConfig {
  static readonly type = '[Config] SetConfig';
  constructor(public config: Partial<ConfigStateModel>) {}
}

export class UpdateChanges extends UndoableAction {
  static readonly type = '[Config] UpdateChanges';
  constructor(
    public details: Partial<ConfigStateModel>,
    undoing = false
  ) {
    super(undoing);
  }
}

type RephraseStrategyPrompts = Record<RephraseStrategy, string>;
type SummaryStrategyPrompts = Record<SummaryStrategy, string>;

export type ConfigStateModel = {
  assemblyaiCredentials: string;
  bucketName: string;
  googleCredentials: string;
  openaiCredentials: string;
  rephraseStrategyPrompts: RephraseStrategyPrompts;
  summaryStrategyPrompts: SummaryStrategyPrompts;
  transcriptionImpl: TranscriptionImpl;
};

@State<ConfigStateModel>({
  name: 'config',
  defaults: {
    assemblyaiCredentials: null, // 👈 of course!
    bucketName: null, // 👈 of course!
    googleCredentials: null, // 👈 of course!
    openaiCredentials: null, // 👈 of course!
    rephraseStrategyPrompts: {
      accuracy:
        'Rephrase my statement as part of a conversation, using grammatical English and paragraphs, and in a natural conversational style',
      brevity:
        'Summarize and simplify my statement in a natural style as part of a conversation'
    },
    summaryStrategyPrompts: {
      bullets:
        'Summarize this discussion into bullet points as if the events discussed happened in the past',
      paragraphs:
        'Summarize this discussion into short paragraphs for a professional reader as if the events discussed happened in the past'
    },
    transcriptionImpl: 'google'
  }
})
@Injectable()
export class ConfigState implements NgxsOnInit {
  @Select(ConfigState.assemblyaiCredentials)
  assemblyaiCredentials$: Observable<string>;
  @Select(ConfigState.bucketName) bucketName$: Observable<string>;
  @Select(ConfigState.googleCredentials)
  googleCredentials$: Observable<string>;
  @Select(ConfigState.openaiCredentials) openaiCredentials$: Observable<string>;
  @Select(ConfigState.transcriptionImpl)
  transcriptionImpl$: Observable<TranscriptionImpl>;

  #openai = inject(OpenAIService);
  #store = inject(Store);
  #transcriber = inject(TranscriberService);
  #uploader = inject(UploaderService);

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(ConfigState.assemblyaiCredentials) assemblyaiCredentials$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static assemblyaiCredentials(config: ConfigStateModel): string {
    return config.assemblyaiCredentials;
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(ConfigState.bucketName) bucketName$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static bucketName(config: ConfigStateModel): string {
    return config.bucketName;
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(ConfigState.configured) configured$
  //    when the Config settings are sufficient for the app to be used
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static configured(config: ConfigStateModel): boolean {
    return (
      !!config.assemblyaiCredentials &&
      !!config.bucketName &&
      !!config.googleCredentials &&
      !!config.openaiCredentials
    );
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(ConfigState.googleCredentials) googleCredentials$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static googleCredentials(config: ConfigStateModel): string {
    return config.googleCredentials;
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(ConfigState.openaiCredentials) openaiCredentials$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static openaiCredentials(config: ConfigStateModel): string {
    return config.openaiCredentials;
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SetConfig
  // //////////////////////////////////////////////////////////////////////////

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetConfig) setConfig({ setState }, { config }: SetConfig): void {
    setState(patch(config));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(ConfigState.transcriptionImpl) transcriptionImpl$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static transcriptionImpl(
    config: ConfigStateModel
  ): TranscriptionImpl {
    return config.transcriptionImpl;
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 UpdateChanges
  //    the big difference between this and SetConfig is that it is undoable
  // //////////////////////////////////////////////////////////////////////////

  @Action(UpdateChanges) updateChanges(
    { getState, setState },
    { details, undoing }: UpdateChanges
  ): void {
    // 👇 capture the original
    const state = deepCopy(getState());
    const changes = deepCopy(details);
    const original: Partial<ConfigStateModel> = {
      ...pluckOriginalFromChanges(state, changes)
    };
    // 👇 only if there's a delta
    if (!deepEqual(original, changes)) {
      // 👇 put the inverse action onto the undo stack
      if (!undoing)
        this.#store.dispatch(
          new StackUndoable([
            new UpdateChanges(original, true),
            new UpdateChanges(changes, true)
          ])
        );
      // 👇 now do the action
      setState(patch(changes));
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟫 Initialization
  // //////////////////////////////////////////////////////////////////////////

  ngxsOnInit(): void {
    this.#monitorAssemblyAICredentials();
    this.#monitorGoogleCredentials();
    this.#monitorOpenAICredentials();
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟦 Helper methods
  // 🙈 https://stackoverflow.com/questions/43881504/how-to-await-inside-rxjs-subscribe-method
  // //////////////////////////////////////////////////////////////////////////

  // 🔥 we can't currently use this uploader as the AssemblyAI CDN only
  //    works within AssemblyAI code -- so we are using Google's instead

  #monitorAssemblyAICredentials(): void {
    combineLatest({
      assemblyaiCredentials: this.assemblyaiCredentials$,
      bucketName: this.bucketName$,
      googleCredentials: this.googleCredentials$,
      transcriptionImpl: this.transcriptionImpl$
    })
      .pipe(
        filter(
          ({
            assemblyaiCredentials,
            bucketName,
            googleCredentials,
            transcriptionImpl
          }) =>
            !!assemblyaiCredentials &&
            !!bucketName &&
            !!googleCredentials &&
            transcriptionImpl === 'assemblyai'
        ),
        switchMap(({ assemblyaiCredentials, bucketName, googleCredentials }) =>
          this.#uploader
            .credentials(googleCredentials, 'google')
            .then(() => this.#uploader.enableCORS(bucketName))
            .then(() =>
              this.#transcriber.credentials(assemblyaiCredentials, 'assemblyai')
            )
        )
      )
      .subscribe();
  }

  #monitorGoogleCredentials(): void {
    combineLatest({
      bucketName: this.bucketName$,
      googleCredentials: this.googleCredentials$,
      transcriptionImpl: this.transcriptionImpl$
    })
      .pipe(
        filter(
          ({ bucketName, googleCredentials, transcriptionImpl }) =>
            !!bucketName &&
            !!googleCredentials &&
            transcriptionImpl === 'google'
        ),
        switchMap(({ bucketName, googleCredentials }) =>
          this.#uploader
            .credentials(googleCredentials, 'google')
            .then(() => this.#uploader.enableCORS(bucketName))
            .then(() =>
              this.#transcriber.credentials(googleCredentials, 'google')
            )
        )
      )
      .subscribe();
  }

  #monitorOpenAICredentials(): void {
    this.openaiCredentials$
      .pipe(
        filter((openaiCredentials) => !!openaiCredentials),
        switchMap((openaiCredentials) =>
          this.#openai.credentials(openaiCredentials)
        )
      )
      .subscribe();
  }
}
