import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

export class SetComponentState {
  static readonly type = '[Component] SetComponentState';
  constructor(public componentState: Partial<ComponentStateModel>) {}
}

export type ComponentStateModel = {
  audio: {
    muted: boolean;
    playbackRate: number;
    volume: number;
  };
  tabIndex: number;
  wavesurfer: {
    minPxPerSec: number;
  };
};

@State<ComponentStateModel>({
  name: 'component',
  defaults: {
    audio: {
      muted: false,
      playbackRate: 1,
      volume: 1
    },
    tabIndex: 0,
    wavesurfer: {
      minPxPerSec: 1
    }
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
    { componentState }: SetComponentState
  ): void {
    setState(patch(componentState));
  }
}
