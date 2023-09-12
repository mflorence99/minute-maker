import { ErrorHandler as AngularErrorHandler } from '@angular/core';
import { Injectable } from '@angular/core';
import { SetStatus } from '#mm/state/status';
import { Store } from '@ngxs/store';

import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorHandler implements AngularErrorHandler {
  #store = inject(Store);

  handleError(error): void {
    this.#store.dispatch(new SetStatus({ error }));
  }
}
