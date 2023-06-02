import { DestroyRef } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';

import { inject } from '@angular/core';
import { takeUntil } from 'rxjs';

// 🙈 https://stackoverflow.com/questions/33441393/is-there-a-way-to-check-for-output-wire-up-from-within-a-component-in-angular
export class WatchableEventEmitter<T> extends EventEmitter<T> {
  subscriberCount = 0;

  override subscribe(
    next?: (value: any) => void,
    error?: (error: any) => void,
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

// 🙈 https://stackoverflow.com/questions/63116039/camelcase-to-kebab-case
export function kebabasize(camelCase): any {
  return camelCase.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($: string, ofs) => (ofs ? '-' : '') + $.toLowerCase()
  );
}

// 🙈 https://netbasal.com/getting-to-know-the-destroyref-provider-in-angular-9791aa096d77
export function untilDestroyed(): any {
  const subject = new Subject();
  inject(DestroyRef).onDestroy(() => {
    subject.next(true);
    subject.complete();
  });
  return () => takeUntil(subject.asObservable());
}
