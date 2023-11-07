import * as Sentry from '@sentry/angular-ivy';

import { Action } from '@ngxs/store';
import { DialogService } from '#mm/services/dialog';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

import { inject } from '@angular/core';
import { patch } from '@ngxs/store/operators';

export class ClearStatus {
  static readonly type = '[Status] ClearStatus';
  constructor(public working?: Working) {}
}

export class SetStatus {
  static readonly type = '[Status] SetStatus';
  constructor(public status: Partial<StatusStateModel>) {}
}

export type StatusStateModel = {
  error: Partial<Error>;
  ix: number;
  status: string;
  working: Working;
};

export class Working {
  constructor(
    public on:
      | 'audio'
      | 'badge'
      | 'rephrase'
      | 'summary'
      | 'transcription'
      | 'upload',
    public canceledBy: Function = null
  ) {}
}

@State<StatusStateModel>({
  name: 'status',
  defaults: StatusState.defaultStatus()
})
@Injectable()
export class StatusState {
  #dialog = inject(DialogService);

  static defaultStatus(): StatusStateModel {
    return {
      error: null,
      ix: null,
      status: null,
      working: null
    };
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 ClearStatus
  // //////////////////////////////////////////////////////////////////////////

  @Action(ClearStatus) clearStatus(
    { getState, setState },
    { working }: ClearStatus
  ): void {
    const status = getState();
    // 👇 only clear the status if it still "belongs" to me
    if (!working || !status.working || working.on === status.working.on)
      setState(StatusState.defaultStatus());
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SetStatus
  // //////////////////////////////////////////////////////////////////////////

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetStatus) async setStatus(
    { setState },
    { status }: SetStatus
  ): Promise<void> {
    if (status.error) {
      await this.#dialog.showErrorBox(
        'An error occured. Please retry.',
        status.error.message
      );
      setState(StatusState.defaultStatus());
      console.error(`🔥 ${status.error.message}`);
      Sentry.captureException(status.error);
    } else setState(patch(status));
  }
}
