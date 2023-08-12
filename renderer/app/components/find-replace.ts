import { AgendaItem } from '#mm/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { Observable } from 'rxjs';
import { RootPage } from '#mm/pages/root';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Transcription } from '#mm/common';
import { UpdateFindReplace } from '#mm/state/minutes';

import { inject } from '@angular/core';

// 🔥 this ONLY works for transcriptions!

// 🔥 and doesn't replace either!

export type FindReplaceMatch = {
  end: number;
  fld: string;
  id: number;
  start: number;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-find-replace',
  template: `
    <article *ngIf="minutes$ | async as minutes">
      <input
        #finder
        (input.throttled)="onFind(finder.value)"
        [mmAutofocus]="true"
        [mmSelectOnFocus]="true"
        [value]="minutes.findReplace?.searchString ?? ''"
        style="border: 1px solid var(--tui-text-01)" />
      <button
        appearance="mono"
        icon="tuiIconArrowUp"
        size="xs"
        tuiIconButton
        type="button"></button>

      <button
        appearance="mono"
        icon="tuiIconArrowDown"
        size="xs"
        tuiIconButton
        type="button"></button>

      <ng-container
        *ngIf="numMatches(minutes) as count; else noMatches"
        [ngPlural]="count">
        <ng-template ngPluralCase="=1">One match</ng-template>
        <ng-template ngPluralCase="other">{{ count }} matches</ng-template>
      </ng-container>
      <ng-template #noMatches>No matches</ng-template>
    </article>
  `,
  styles: []
})
export class FindReplaceComponent {
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;

  #matches: FindReplaceMatch[] = [];
  #root = inject(RootPage);
  #store = inject(Store);

  numMatches(minutes: Minutes): number {
    let numMatches = 0;
    this.#matches = [];
    const searchString = minutes.findReplace?.searchString;
    if (searchString) {
      const regexp = new RegExp(searchString, 'gi');
      numMatches = (minutes.transcription ?? []).reduce((acc, tx) => {
        acc += this.#matchAll(tx, 'title', regexp);
        acc += this.#matchAll(tx, 'speaker', regexp);
        acc += this.#matchAll(tx, 'speech', regexp);
        return acc;
      }, 0);
    }
    this.#root.onFindReplaceMatch(this.#matches);
    return numMatches;
  }

  onFind(searchString: string): void {
    this.#store.dispatch(new UpdateFindReplace({ searchString }));
  }

  #matchAll(
    tx: AgendaItem | Transcription,
    fld: string,
    regexp: RegExp
  ): number {
    const str = tx[fld];
    if (str) {
      const matches = Array.from(str.matchAll(regexp));
      matches.forEach((match: any) =>
        this.#matches.push({
          id: tx.id,
          fld,
          start: match.index,
          end: match.index + match[0].length
        })
      );
      return matches.length;
    } else return 0;
  }
}
