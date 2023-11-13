import { AgendaItem } from '#mm/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
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

// 🔥 1. this ONLY works for transcriptions!
//    2. replace is not yet implemented (and may never be)
//    3. directive is bundled with component, as they are interdependent

export type FindReplaceMatch = {
  end: number;
  fld: string;
  id: number;
  start: number;
};

// //////////////////////////////////////////////////////////////////////////
// 🟩 Component (see directive below)
// //////////////////////////////////////////////////////////////////////////

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-find-replace',
  template: `
    @if (minutes$ | async; as minutes) {
      <article>
        <input
          #finder
          (input.throttled)="onFind(finder.value)"
          [mmAutofocus]="true"
          [mmSelectOnFocus]="true"
          [value]="minutes.findReplace?.searchString ?? ''"
          style="border: 1px solid var(--tui-text-01)" />

        <span style="display: inline-block; padding-left: 0.5rem; width: 6rem">
          @if (numMatches(minutes); as count) {
            <ng-container [ngPlural]="count">
              <ng-template ngPluralCase="=1">One match</ng-template>
              <ng-template ngPluralCase="other">
                {{ count }} matches
              </ng-template>
            </ng-container>
          } @else {
            No matches
          }
        </span>

        <button
          (click.silent)="emitMatch(-1)"
          [disabled]="!this.canEmitMatch()"
          appearance="mono"
          icon="tuiIconArrowUp"
          size="xs"
          tuiIconButton
          type="button"></button>

        <button
          (click.silent)="emitMatch(+1)"
          [disabled]="!this.canEmitMatch()"
          appearance="mono"
          icon="tuiIconArrowDown"
          size="xs"
          tuiIconButton
          type="button"></button>
      </article>
    }
  `
})
export class FindReplaceComponent {
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;

  #matchIx = -1;
  #matches: FindReplaceMatch[] = [];
  #root = inject(RootPage);
  #store = inject(Store);

  canEmitMatch(): boolean {
    return this.#matches.length > 0;
  }

  emitMatch(incr: number): void {
    if (this.#matches.length > 0) {
      this.#matchIx += incr;
      if (this.#matchIx < 0) this.#matchIx = this.#matches.length - 1;
      else if (this.#matchIx > this.#matches.length - 1) this.#matchIx = 0;
      this.#root.onFindReplaceMatch(this.#matches[this.#matchIx]);
    } else this.#root.onFindReplaceMatch(null);
  }

  // 👇 as a side-effect of calculating numMatches (needed for the template)
  //    we also develop #matches as FindReplaceMatch[] (needed by the
  //    TranscriptionComponent to select matching text)

  numMatches(minutes: Minutes): number {
    let numMatches = 0;
    this.#matches = [];
    const searchString = minutes.findReplace?.searchString;
    if (searchString) {
      const regexp = new RegExp(
        // 🔥 really need to DRY this!
        searchString.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'),
        'gi'
      );
      numMatches = (minutes.transcription ?? []).reduce((acc, tx) => {
        acc += this.#matchAll(tx, 'title', regexp);
        acc += this.#matchAll(tx, 'speaker', regexp);
        acc += this.#matchAll(tx, 'speech', regexp);
        return acc;
      }, 0);
    }
    return numMatches;
  }

  onFind(searchString: string): void {
    this.#matchIx = -1;
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

// //////////////////////////////////////////////////////////////////////////
// 🟦 Directive
// //////////////////////////////////////////////////////////////////////////

@Directive({
  selector:
    'mm-transcription input[mmFindReplaceMatch], mm-transcription textarea[mmFindReplaceMatch]'
})
export class FindReplaceMatchDirective {
  @Input({ required: true }) mmFindReplaceMatchFld: string;
  @Input({ required: true }) mmFindReplaceMatchID: number;

  #mmFindReplaceMatch: FindReplaceMatch;
  #textarea = inject(ElementRef).nativeElement; // 👈 textarea or input

  @Input() get mmFindReplaceMatch(): FindReplaceMatch {
    return this.#mmFindReplaceMatch;
  }

  set mmFindReplaceMatch(match: FindReplaceMatch) {
    this.#mmFindReplaceMatch = match;
    if (
      match?.id === this.mmFindReplaceMatchID &&
      match?.fld === this.mmFindReplaceMatchFld
    ) {
      // 👇 we need to let any scroll / hydrate take place first
      setTimeout(() => {
        this.#textarea.setSelectionRange(match.start, match.end);
        this.#textarea.focus();
      }, 0);
    }
  }
}
