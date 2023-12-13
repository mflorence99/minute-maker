import { EventEmitter } from '@angular/core';
import { OperatorFunction } from 'rxjs';
import { Subscription } from 'rxjs';

import { map } from 'rxjs';
import { pairwise } from 'rxjs';
import { pipe } from 'rxjs';
import { startWith } from 'rxjs';

import deepEqual from 'deep-equal';

// //////////////////////////////////////////////////////////////////////////
// 🟦 WatchableEventEmitter
// //////////////////////////////////////////////////////////////////////////

// 🙈 https://stackoverflow.com/questions/33441393/is-there-a-way-to-check-for-output-wire-up-from-within-a-component-in-angular
export class WatchableEventEmitter<T = any> extends EventEmitter<T> {
  subscriberCount = 0;

  override subscribe(
    next?: (value) => void,
    error?: (error) => void,
    complete?: () => void
  ): Subscription {
    ++this.subscriberCount;
    return super.subscribe(next, error, complete);
  }

  override unsubscribe(): void {
    --this.subscriberCount;
    super.unsubscribe();
  }
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 kebabasize
// //////////////////////////////////////////////////////////////////////////

// 🙈 https://stackoverflow.com/questions/63116039/camelcase-to-kebab-case
export function kebabasize(camelCase: string): any {
  return camelCase.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($: string, ofs) => (ofs ? '-' : '') + $.toLowerCase()
  );
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 pluckOriginalFromChanges
// //////////////////////////////////////////////////////////////////////////

export function pluckOriginalFromChanges(state: any, changes: any): any {
  // 👇 pluck only the original of the changed details
  const original = Object.keys(changes).reduce((plucked, key) => {
    if (!deepEqual(changes[key], state[key])) plucked[key] = state[key];
    else delete changes[key];
    return plucked;
  }, {});
  return original;
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 withPreviousItem custom rxjs operator
// //////////////////////////////////////////////////////////////////////////

// 🙈 https://stackoverflow.com/questions/50059622
export function withPreviousItem<T>(): OperatorFunction<
  T,
  { current: T; previous?: T }
> {
  return pipe(
    startWith(undefined),
    pairwise(),
    map(([previous, current]) => ({
      current,
      previous
    }))
  );
}
