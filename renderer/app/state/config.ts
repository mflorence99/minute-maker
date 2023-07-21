import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { RephraseStrategy } from '#mm/common';
import { Selector } from '@ngxs/store';
import { Stack as StackUndoable } from '#mm/state/undo';
import { State } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { SummaryStrategy } from '#mm/common';
import { UndoableAction } from '#mm/state/undo';
import { UploaderService } from '#mm/services/uploader';

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
  rephraseStrategyPrompts: RephraseStrategyPrompts;
  summaryStrategyPrompts: SummaryStrategyPrompts;
};

@State<ConfigStateModel>({
  name: 'config',
  defaults: {
    bucketName: 'washington-app-319514.appspot.com', // 🔥 convenient for now
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
  #store = inject(Store);
  #uploader = inject(UploaderService);

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(ConfigState.bucketName) bucketName$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static bucketName(config: ConfigStateModel): string {
    return config.bucketName;
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
  // //////////////////////////////////////////////////////////////////////////

  ngxsOnInit(): void {
    const bucketName$ = this.#store.select(ConfigState.bucketName);
    // 🙈 https://stackoverflow.com/questions/43881504/how-to-await-inside-rxjs-subscribe-method
    bucketName$
      .pipe(switchMap((bucketName) => this.#uploader.enableCORS(bucketName)))
      .subscribe();
  }
}
