import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Transcription } from '#mm/common';

export class XXX {
  static readonly type = '[Minutes] XXX';
  constructor() {}
}

export type Minutes = {
  audio: {
    gcsuri: string;
    url: string;
  };
  subject: string;
  subtitle: string;
  title: string;
  transcription: Transcription[];
};

export type MinutesStateModel = Minutes;

@State<MinutesStateModel>({
  name: 'minutes',
  defaults: null
})
@Injectable()
export class MinutesState {
  //
  // 🔥 DUMMY
  @Action(XXX) xxx(ctx: StateContext<MinutesStateModel>, action: XXX): void {
    console.log(action);
    ctx.setState(null);
  }
}
