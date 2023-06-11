import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Transcription } from '#mm/common';

export class SetMinutes {
  static readonly type = '[Minutes] SetMinutes';
  constructor(public minutes: Minutes) {}
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

  @Action(SetMinutes) setMinutes(
    ctx: StateContext<MinutesStateModel>,
    action: SetMinutes
  ): void {
    ctx.setState(action.minutes);
  }
}
