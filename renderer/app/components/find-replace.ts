import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';

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
        style="border: 1px solid gray"
        value="" />
      <div>{{ numMatches }} results</div>
    </article>
  `,
  styles: []
})
export class FindReplaceComponent {
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;

  numMatches = 0;

  onFind(value: string, minutes: Minutes): void {
    console.log({ searchString: value });
    const regex = new RegExp(value, 'gi');
    this.numMatches = (minutes.transcription ?? []).reduce((acc, tx) => {
      if (tx.type === 'TX') {
        acc += ((tx.speaker || '').match(regex) || []).length;
        acc += ((tx.speech || '').match(regex) || []).length;
      }
      return acc;
    }, 0);
  }
}
