import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { UpdateFindReplace } from '#mm/state/minutes';

import { inject } from '@angular/core';

// 🔥 this ONLY works for transcriptions!

// 🔥 and doesn't replace either!

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-find-replace',
  template: `
    <article *ngIf="minutes$ | async as minutes">
      <input
        #finder
        (input.throttled)="onFind(finder.value, minutes)"
        [value]="minutes.findReplace?.searchString"
        style="border: 1px solid var(--tui-text-01)" />
      <aside [ngPlural]="numMatches">
        <ng-template ngPluralCase="=0">No matches</ng-template>
        <ng-template ngPluralCase="=1">One match</ng-template>
        <ng-template ngPluralCase="other">{{ numMatches }} matches</ng-template>
      </aside>
    </article>
  `,
  styles: []
})
export class FindReplaceComponent implements OnInit {
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;

  numMatches = 0;

  #store = inject(Store);

  // 🔥 TEMPORARY

  ngOnInit(): void {
    const minutes = this.#store.selectSnapshot<Minutes>(MinutesState);
    this.numMatches = this.#matchSearchString(
      minutes.findReplace?.searchString,
      minutes
    );
  }

  onFind(searchString: string, minutes: Minutes): void {
    console.log({ searchString });
    this.#store.dispatch(new UpdateFindReplace({ searchString }));
    this.numMatches = this.#matchSearchString(searchString, minutes);
  }

  #matchSearchString(searchString: string, minutes: Minutes): number {
    if (searchString) {
      const regex = new RegExp(searchString, 'gi');
      const numMatches = (minutes.transcription ?? []).reduce((acc, tx) => {
        if (tx.type === 'AG')
          acc += ((tx.title || '').match(regex) || []).length;
        else if (tx.type === 'TX') {
          acc += ((tx.speaker || '').match(regex) || []).length;
          acc += ((tx.speech || '').match(regex) || []).length;
        }
        return acc;
      }, 0);
      return numMatches;
    } else return 0;
  }
}
