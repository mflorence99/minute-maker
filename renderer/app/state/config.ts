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
  constructor(public details: Partial<ConfigStateModel>, undoing = false) {
    super(undoing);
  }
}

type RephraseStrategyPrompts = Record<RephraseStrategy, string>;
type SummaryStrategyPrompts = Record<SummaryStrategy, string>;

export type ConfigStateModel = {
  bucketName: string;
  googleCredentials: string;
  openaiCredentials: string;
  rephraseStrategyPrompts: RephraseStrategyPrompts;
  summaryStrategyPrompts: SummaryStrategyPrompts;
};

@State<ConfigStateModel>({
  name: 'config',
  defaults: {
    bucketName: 'washington-app-319514.appspot.com', // 🔥 convenient for now
    googleCredentials: null, // 👈 of course!
    openaiCredentials: null, // 👈 of course!
    rephraseStrategyPrompts: {
      accuracy:
        'Rephrase my statement in the first person, using grammatical English and paragraphs',
      brevity: 'Summarize my statement in the first person'
    },
    summaryStrategyPrompts: {
      bullets: 'Summarize this discussion into a few bullet points',
      paragraphs:
        'Using the past tense, summarize this discussion into short paragraphs for a professional reader'
    }
  }
})
@Injectable()
export class ConfigState implements NgxsOnInit {
  @Select(ConfigState.bucketName) bucketName$: Observable<string>;
  @Select(ConfigState.googleCredentials)
  googleCredentials$: Observable<string>;
  @Select(ConfigState.openaiCredentials) openaiCredentials$: Observable<string>;

  #openai = inject(OpenAIService);
  #store = inject(Store);
  #transcriber = inject(TranscriberService);
  #uploader = inject(UploaderService);

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(ConfigState.bucketName) bucketName$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static bucketName(config: ConfigStateModel): string {
    return config.bucketName;
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
  // 🙈 https://stackoverflow.com/questions/43881504/how-to-await-inside-rxjs-subscribe-method
  // //////////////////////////////////////////////////////////////////////////

  ngxsOnInit(): void {
    // 👇 changes in Google credentials
    combineLatest({
      googleCredentials: this.googleCredentials$,
      bucketName: this.bucketName$
    })
      .pipe(
        filter(({ googleCredentials }) => !!googleCredentials),
        switchMap(({ googleCredentials, bucketName }) =>
          this.#uploader
            .credentials(googleCredentials)
            .then(() => this.#uploader.enableCORS(bucketName))
            .then(() => this.#transcriber.credentials(googleCredentials))
        )
      )
      .subscribe();
    // 👇 changes in OpenAI credentials
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
