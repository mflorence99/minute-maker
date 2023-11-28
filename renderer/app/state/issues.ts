import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { State } from '@ngxs/store';
import { TabIndex } from '#mm/state/component';

export class AnalyzeMinutes {
  static readonly type = '[Issues] AnalyzeMinutes';
  constructor(public minutes: Minutes) {}
}

export type Issue = {
  message: string;
  severity: 'error' | 'warning';
  tabIndex: TabIndex;
  txid: number;
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
        txid: 14
      },
      {
        message: 'Organization not specified',
        severity: 'warning',
        tabIndex: TabIndex.details,
        txid: 14
      }
    ]);
  }
}
