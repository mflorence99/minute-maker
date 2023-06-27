import { AgendaItem } from '#mm/common';
import { EventEmitter } from '@angular/core';
import { MinutesStateModel } from '#mm/state/minutes';
import { OperatorFunction } from 'rxjs';
import { Subscription } from 'rxjs';
import { Transcription } from '#mm/common';

import { map } from 'rxjs';
import { pairwise } from 'rxjs';
import { pipe } from 'rxjs';
import { startWith } from 'rxjs';

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

// 🙈 https://stackoverflow.com/questions/63116039/camelcase-to-kebab-case
export function kebabasize(camelCase: string): any {
  return camelCase.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($: string, ofs) => (ofs ? '-' : '') + $.toLowerCase()
  );
}

export function pluckAgendaItem(
  state: MinutesStateModel,
  ix: number
): AgendaItem {
  if (state.transcription[ix].type === 'AG')
    return state.transcription[ix] as any as AgendaItem;
  else throw new Error(`Operation not supported for item #${ix}`);
}

export function pluckTranscription(
  state: MinutesStateModel,
  ix: number
): Transcription {
  if (state.transcription[ix].type === 'TX')
    return state.transcription[ix] as any as Transcription;
  else throw new Error(`Operation not supported for item #${ix}`);
}

// 🙈 https://stackoverflow.com/questions/14368596/how-can-i-check-that-two-objects-have-the-same-set-of-property-names
export function objectsHaveSameKeys(...objects): boolean {
  const allKeys = objects.reduce(
    (keys, object) => keys.concat(Object.keys(object)),
    []
  );
  const union = new Set(allKeys);
  return objects.every((object) => union.size === Object.keys(object).length);
}

// 🙈 https://stackoverflow.com/questions/50059622
export function withPreviousItem<T>(): OperatorFunction<
  T,
  { current: T; previous?: T }
> {
  return pipe(
    startWith(undefined),
    pairwise(),
    map(([previous, current]) => ({
      previous,
      current: current
    }))
  );
}
