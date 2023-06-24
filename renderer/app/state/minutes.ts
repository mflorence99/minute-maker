import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { Transcription } from '#mm/common';

import { patch } from '@ngxs/store/operators';

export class SetMinutes {
  static readonly type = '[Minutes] SetMinutes';
  constructor(public minutes: Partial<Minutes>) {}
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

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetMinutes) setMinutes({ setState }, { minutes }): void {
    if (minutes.audio) setState({ audio: patch(minutes.audio) });
    setState(patch(minutes));
  }

  @Selector() static transcription(
    minutes: MinutesStateModel
  ): Transcription[] {
    return minutes?.transcription ?? [];
  }
}
