import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

export class SetComponentState {
  static readonly type = '[Component] SetComponentState';
  constructor(public state: Partial<ComponentStateModel>) {}
}

export type ComponentStateModel = {
  audio: {
    muted: boolean;
    rate: number;
    volume: number;
  };
  tabIndex: number;
  transcriptionName: string;
};

@State<ComponentStateModel>({
  name: 'component',
  defaults: {
    audio: {
      muted: false,
      rate: 1,
      volume: 1
    },
    tabIndex: 0,
    transcriptionName: null
  }
})
@Injectable()
export class ComponentState {
  //

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SetComponentState
  // //////////////////////////////////////////////////////////////////////////

  @Action(SetComponentState) setComponentState(
    { setState }: StateContext<ComponentStateModel>,
    { state }: SetComponentState
  ): void {
    setState(patch(state));
  }
}
