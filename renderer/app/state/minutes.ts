import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { Selector } from '@ngxs/store';
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
  //

  @Selector() static audioURL(minutes: MinutesStateModel): string {
    return minutes?.audio?.url;
  }

  @Action(SetMinutes) setMinutes({ setState }, { minutes }): void {
    setState(minutes);
  }
}
