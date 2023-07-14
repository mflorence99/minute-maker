import { AgendaItem } from '#mm/common';
import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
import { Component } from '@angular/core';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { NewMinutes } from '#mm/state/app';
import { Observable } from 'rxjs';
import { OpenMinutes } from '#mm/state/app';
import { Select } from '@ngxs/store';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { Summary } from '#mm/common';
import { Transcription } from '#mm/common';

import { delay } from 'rxjs';
import { inject } from '@angular/core';

@Component({
  selector: 'mm-root',
  template: `
    <tui-root *ngIf="minutes$ | async as minutes; else getStarted">
      <main>
        <header>
          <h2>{{ minutes.title }}</h2>
          <pre>{{ (app$ | async).pathToMinutes }}</pre>
        </header>

        <mm-wavesurfer
          [audioFile]="minutes.audio.url"
          [options]="{ barGap: 2, barRadius: 2, barWidth: 2 }"
          class="wavesurfer">
          <mm-wavesurfer-timeline></mm-wavesurfer-timeline>
        </mm-wavesurfer>

        <nav class="tabs">
          <tui-tabs [(activeItemIndex)]="tabIndex">
            <button tuiTab>Transcription</button>
            <button tuiTab>Summary</button>
          </tui-tabs>
        </nav>

        <mm-transcription
          (selected)="txIndex = $event"
          [ngClass]="{ data: true, hidden: tabIndex !== 0 }"
          [transcription]="transcription$ | async" />

        <mm-summary
          [ngClass]="{ data: true, hidden: tabIndex !== 1 }"
          [summary]="summary$ | async" />

        <footer class="footer">
          <ng-container *ngIf="status$ | async as status">
            <progress *ngIf="!!status.working"></progress>
            <label>{{ status.status }}</label>
          </ng-container>
        </footer>
      </main>
    </tui-root>

    <ng-template #getStarted>
      <tui-block-status>
        <img tuiSlot="top" src="./assets/meeting.png" />
        <h4>To get started ...</h4>
        <p>
          You can perform these actions at anytime from the
          <b>File</b>
          menu.
        </p>
        <button (click)="newMinutes()" appearance="primary" size="m" tuiButton>
          New Minutes from MP3 Audio
        </button>
        <button (click)="openMinutes()" appearance="accent" size="m" tuiButton>
          Open Minutes JSON File
        </button>
      </tui-block-status>
    </ng-template>
  `
})
export class RootPage {
  @Select(AppState) app$: Observable<AppStateModel>;
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;
  @Select(StatusState) status$: Observable<StatusStateModel>;
  @Select(MinutesState.summary) summary$: Observable<Summary[]>;
  @Select(MinutesState.transcription) transcription$: Observable<
    (AgendaItem | Transcription)[]
  >;

  status: StatusStateModel;
  tabIndex = 0;
  txIndex = 0;

  #store = inject(Store);

  constructor() {
    // 👇 induce a delay to prevent Angular change detection errors
    this.status$.pipe(delay(0)).subscribe((status) => {
      this.status = status;
    });
  }

  newMinutes(): void {
    this.#store.dispatch(new NewMinutes());
  }

  openMinutes(): void {
    this.#store.dispatch(new OpenMinutes());
  }
}
