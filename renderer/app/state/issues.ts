import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { State } from '@ngxs/store';
import { TabIndex } from '#mm/state/component';
import { Transcription } from '#mm/common';

export class AnalyzeMinutes {
  static readonly type = '[Issues] AnalyzeMinutes';
  constructor(public minutes: Minutes) {}
}

export type Issue = {
  message: string;
  severity: 'error' | 'warning';
  tabIndex: TabIndex;
  tx?: Transcription;
};

export type IssuesStateModel = Issue[];

@State<IssuesStateModel>({
  name: 'issues',
  defaults: []
})
@Injectable()
export class IssuesState {
  //

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 AnalyzeMinutes
  // //////////////////////////////////////////////////////////////////////////

  @Action(AnalyzeMinutes) analyzeMinutes(
    { setState },
    { minutes }: AnalyzeMinutes
  ): void {
    setState([
      {
        message: 'Unidentified speaker `Speaker_A`',
        severity: 'error',
        tabIndex: TabIndex.transcription,
        tx: minutes.transcription[0]
      },
      {
        message: 'Organization not specified',
        severity: 'warning',
        tabIndex: TabIndex.details
      }
    ]);
  }
}
