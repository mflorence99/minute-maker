import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { State } from '@ngxs/store';

export class AnalyzeMinutes {
  static readonly type = '[Issues] AnalyzeMinutes';
  constructor(public minutes: Minutes) {}
}

export type Issue = {};

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
    setState([]);
  }
}
