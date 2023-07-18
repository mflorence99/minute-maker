import { AgendaItem } from '#mm/common';
import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
import { Component } from '@angular/core';
import { Constants } from '#mm/common';
import { DestroyRef } from '@angular/core';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { NewMinutes } from '#mm/state/app';
import { Observable } from 'rxjs';
import { OpenMinutes } from '#mm/state/app';
import { Select } from '@ngxs/store';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { Summary } from '#mm/common';
import { SwitchTab } from '#mm/state/app';
import { Transcription } from '#mm/common';
import { ViewChild } from '@angular/core';
import { WaveSurferComponent } from '#mm/components/wavesurfer';

import { delay } from 'rxjs';
import { distinctUntilChanged } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { throttleTime } from 'rxjs';

import dayjs from 'dayjs';

@Component({
  selector: 'mm-root',
  template: `
    <tui-root *ngIf="minutes$ | async as minutes; else getStarted">
      <main *ngIf="app$ | async as app">
        <header>
          <h2>
            {{ minutes.title }} &bull;
            {{ dayjs(minutes.date).format('MMMM D, YYYY') }}
          </h2>
          <pre>{{ app.pathToMinutes }}</pre>
        </header>

        <mm-wavesurfer
          #wavesurfer
          (timeupdate)="onTimeUpdate($event)"
          [audioFile]="minutes.audio.url"
          [options]="{ barGap: 2, barRadius: 2, barWidth: 2 }"
          class="wavesurfer">
          <mm-wavesurfer-timeline></mm-wavesurfer-timeline>
          <mm-wavesurfer-regions>
            <!-- 👇 only one region that we update -->
            <mm-wavesurfer-region
              *ngIf="currentTx"
              [params]="{
                end: currentTx.end,
                id: 'singleton',
                start: currentTx.start,
              }" />
          </mm-wavesurfer-regions>
        </mm-wavesurfer>

        <nav class="tabs">
          <tui-tabs
            (activeItemIndexChange)="onSwitchTab($event)"
            [activeItemIndex]="app.tabIndex">
            <button tuiTab>Meeting Details</button>
            <button tuiTab>Transcription</button>
            <button tuiTab>Summary</button>
          </tui-tabs>
        </nav>

        <mm-metadata
          [ngClass]="{ data: true, hidden: app.tabIndex !== 0 }"
          [minutes]="minutes" />

        <mm-transcription
          (selected)="onSelected($event)"
          [currentTx]="currentTx"
          [ngClass]="{ data: true, hidden: app.tabIndex !== 1 }"
          [transcription]="transcription$ | async" />

        <mm-summary
          [ngClass]="{ data: true, hidden: app.tabIndex !== 2 }"
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

  @ViewChild(WaveSurferComponent) wavesurfer;

  currentTx: Transcription = null;
  dayjs = dayjs;
  status: StatusStateModel;

  #destroyRef = inject(DestroyRef);
  #store = inject(Store);
  #timeupdate$ = new Subject<number>();

  constructor() {
    // 👇 induce a delay to prevent Angular change detection errors
    this.status$.pipe(delay(0)).subscribe((status) => {
      this.status = status;
    });
    // 👇 update the current tx as the waveform plays
    this.#timeupdate$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        throttleTime(Constants.timeupdateThrottleInterval),
        map((ts: number) => {
          const txs = this.#store.selectSnapshot(MinutesState.transcription);
          return txs.find(
            (tx) => tx.type === 'TX' && ts >= tx.start && ts < tx.end
          );
        }),
        distinctUntilChanged()
      )
      .subscribe((tx: Transcription) => {
        this.currentTx = tx;
      });
  }

  newMinutes(): void {
    this.#store.dispatch(new NewMinutes());
  }

  onSelected(tx: Transcription): void {
    this.currentTx = tx;
    this.wavesurfer.wavesurfer.setTime(tx.start);
  }

  onSwitchTab(tabIndex: number): void {
    this.#store.dispatch(new SwitchTab(tabIndex));
  }

  onTimeUpdate(ts: number): void {
    this.#timeupdate$.next(ts);
  }

  openMinutes(): void {
    this.#store.dispatch(new OpenMinutes());
  }
}
