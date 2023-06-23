import * as Sentry from '@sentry/angular-ivy';

import { Action } from '@ngxs/store';
import { DialogService } from '#mm/services/dialog';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

import { inject } from '@angular/core';
import { patch } from '@ngxs/store/operators';

export class ClearStatus {
  static readonly type = '[Status] ClearStatus';
  constructor() {}
}

export class SetStatus {
  static readonly type = '[Status] SetStatus';
  constructor(public status: Partial<StatusStateModel>) {}
}

export type StatusStateModel = {
  error: Error;
  status: string;
  working: boolean;
};

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
      status: '',
      working: false
    };
  }

  @Action(ClearStatus) clearStatus({ setState }): void {
    setState(StatusState.defaultStatus());
  }

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetStatus) setStatus({ setState }, { status }): void {
    if (status.error) {
      this.#dialog.showErrorBox(
        'An error occured. Please retry.',
        status.error.message
      );
      console.error(`🔥 ${status.error.message}`);
      Sentry.captureException(status.error);
    }
    setState(patch(status));
  }
}
