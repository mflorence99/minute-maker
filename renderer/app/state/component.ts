import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

export class SetComponentState {
  static readonly type = '[Component] SetComponentState';
  constructor(public componentState: Partial<ComponentStateModel>) {}
}

export type AudioState = {
  muted: boolean;
  playbackRate: number;
  volume: number;
};

// 🔥 tabs can only be referenced by number, not name so be sure
//    to change this enum if you change the tab order

export enum TabIndex {
  details = 0,
  badges = 1,
  transcription = 2,
  summary = 3,
  preview = 4,
  issues = 5,
  settings = 6
}

export type WavesurferState = {
  minPxPerSec: number;
};

export type ComponentStateModel = {
  audio: AudioState;
  tabIndex: TabIndex;
  wavesurfer: WavesurferState;
};

export function defaultComponentState(): ComponentStateModel {
  return {
    audio: {
      muted: false,
      playbackRate: 1,
      volume: 1
    },
    tabIndex: TabIndex.details,
    wavesurfer: {
      minPxPerSec: 1
    }
  };
}

@State<ComponentStateModel>({
  name: 'component',
  defaults: defaultComponentState()
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
