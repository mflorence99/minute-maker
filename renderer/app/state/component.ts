import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

export class SetComponentState {
  static readonly type = '[Component] SetComponentState';
  constructor(public componentState: Partial<ComponentStateModel>) {}
}

// 🔥 tabs can only be referenced by number, not name so be sure
//    to change this enum if you change the tab order

export enum TabIndex {
  details = 0,
  transcription = 1,
  summary = 2,
  preview = 3,
  settings = 4
}

export type ComponentStateModel = {
  audio: {
    muted: boolean;
    playbackRate: number;
    volume: number;
  };
  tabIndex: TabIndex;
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
    tabIndex: TabIndex.details,
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
