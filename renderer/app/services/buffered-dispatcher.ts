import { Constants } from '#mm/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';

import { debounce } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { objectsHaveSameKeys } from '#mm/utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { withPreviousItem } from '#mm/utils';

@Injectable({ providedIn: 'root' })
export class BufferedDispatcherService {
  #buffer$ = new Subject<any>();
  #store = inject(Store);

  constructor() {
    this.#buffer$
      .pipe(
        takeUntilDestroyed(),
        withPreviousItem(),
        debounce(({ previous, current }) =>
          !previous || !objectsHaveSameKeys(previous, current)
            ? timer(0)
            : timer(Constants.bufferedDispatchDebounceTime)
        ),
        map(({ current }) => current)
      )
      .subscribe((action) => this.#store.dispatch(action));
  }

  dispatch(action: any): void {
    this.#buffer$.next(action);
  }
}
