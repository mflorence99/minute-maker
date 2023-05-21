import { EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';

// 🙈 https://stackoverflow.com/questions/63116039/camelcase-to-kebab-case
export function kebabasize(camelCase): string {
  return camelCase.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($: string, ofs) => (ofs ? '-' : '') + $.toLowerCase()
  );
}

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
