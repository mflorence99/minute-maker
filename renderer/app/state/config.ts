import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { RephraseStrategy } from '#mm/common';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { SummaryStrategy } from '#mm/common';
import { UploaderService } from '#mm/services/uploader';

import { inject } from '@angular/core';
import { patch } from '@ngxs/store/operators';
import { switchMap } from 'rxjs';

export class SetConfig {
  static readonly type = '[Config] SetConfig';
  constructor(public config: Partial<ConfigStateModel>) {}
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
