import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { State } from '@ngxs/store';

export class SetMinutes {
  static readonly type = '[Minutes] SetMinutes';
  constructor(public minutes: Minutes) {}
}

export type MinutesStateModel = Minutes;

@State<MinutesStateModel>({
  name: 'minutes',
  defaults: null
})
@Injectable()
export class MinutesState {
  @Action(SetMinutes) setMinutes({ setState }, { minutes }): void {
    setState(minutes);
  }
}
