import { AgendaItem } from '#mm/common';
import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
import { Clear as ClearUndoStacks } from '#mm/state/undo';
import { Component } from '@angular/core';
import { ComponentState } from '#mm/state/component';
import { ComponentStateModel } from '#mm/state/component';
import { ConfigState } from '#mm/state/config';
import { ConfigStateModel } from '#mm/state/config';
import { Constants } from '#mm/common';
import { ControllerService } from '#mm/services/controller';
import { DestroyRef } from '@angular/core';
import { HostListener } from '@angular/core';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { Observable } from 'rxjs';
import { Redo } from '#mm/state/undo';
import { Select } from '@ngxs/store';
import { SetComponentState } from '#mm/state/component';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { Summary } from '#mm/common';
import { Transcription } from '#mm/common';
import { Undo } from '#mm/state/undo';
import { ViewChild } from '@angular/core';
import { WaveSurferComponent } from '#mm/components/wavesurfer';

import { delay } from 'rxjs';
import { distinctUntilChanged } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { throttleTime } from 'rxjs';

import dayjs from 'dayjs';
import deepCopy from 'deep-copy';

@Component({
  selector: 'mm-root',
  template: `
    <tui-root *ngIf="minutes$ | async as minutes; else getStarted">
      <main>
        <header class="header">
          <h2>
            {{ minutes.title }} &bull;
            {{ dayjs(minutes.date).format('MMMM D, YYYY') }}
          </h2>
          <pre>{{ (app$ | async).pathToMinutes }}</pre>
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
            [(activeItemIndex)]="state.tabIndex">
            <button tuiTab>Meeting Details</button>
            <button tuiTab>
              Transcription
              <tui-badge
                class="tui-space_bottom-2"
                size="xs"
                status="primary"
                [value]="minutes.numSpeakers"></tui-badge>
            </button>
            <button tuiTab>Summary</button>
            <div style="flex-grow: 2"></div>
            <button tuiTab>
              <tui-svg src="tuiIconSettings"></tui-svg>
              Settings
            </button>
          </tui-tabs>
        </nav>

        <mm-metadata
          [ngClass]="{ data: true, hidden: state.tabIndex !== 0 }"
          [minutes]="minutes" />

        <mm-transcription
          (selected)="onSelected($event)"
          [currentTx]="currentTx"
          [ngClass]="{ data: true, hidden: state.tabIndex !== 1 }"
          [transcription]="transcription$ | async" />

        <mm-summary
          [ngClass]="{ data: true, hidden: state.tabIndex !== 2 }"
          [summary]="summary$ | async" />

        <mm-config
          [ngClass]="{ data: true, hidden: state.tabIndex !== 3 }"
          [config]="config$ | async" />

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
          These actions can be performed at anytime from the
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
  @Select(ConfigState) config$: Observable<ConfigStateModel>;
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;
  @Select(StatusState) status$: Observable<StatusStateModel>;
  @Select(MinutesState.summary) summary$: Observable<Summary[]>;
  @Select(MinutesState.transcription) transcription$: Observable<
    (AgendaItem | Transcription)[]
  >;

  @ViewChild(WaveSurferComponent) wavesurfer;

  currentTx: Transcription = null;
  dayjs = dayjs;
  state: ComponentStateModel;
  status: StatusStateModel;

  #controller = inject(ControllerService);
  #destroyRef = inject(DestroyRef);
  #store = inject(Store);
  #timeupdate$ = new Subject<number>();

  constructor() {
    // 👇 initialize the component state
    this.state = deepCopy(this.#store.selectSnapshot(ComponentState));
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

  // 👇 Chrome has default udo/redo handlers for inputs and textareas
  //    we must use our own unfo stack instead

  @HostListener('window:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ') {
      this.#store.dispatch(new Undo());
      event.preventDefault();
    }
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyY') {
      this.#store.dispatch(new Redo());
      event.preventDefault();
    }
  }

  newMinutes(): void {
    this.#controller.newMinutes();
  }

  onSelected(tx: Transcription): void {
    this.currentTx = tx;
    this.wavesurfer.wavesurfer.setTime(tx.start);
  }

  onSwitchTab(tabIndex: number): void {
    this.#store.dispatch([
      new ClearUndoStacks(), // 👈 don't undo what isn't showing
      new SetComponentState({ tabIndex })
    ]);
  }

  onTimeUpdate(ts: number): void {
    this.#timeupdate$.next(ts);
  }

  openMinutes(): void {
    this.#controller.openMinutes();
  }
}
