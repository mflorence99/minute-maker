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
import { Minutes } from '#mm/common';
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
          <mm-wavesurfer-regions>
            <!-- 👇 only one region that we update -->
            <mm-wavesurfer-region
              *ngIf="currentTx"
              [params]="{
                end: currentTx.end,
                id: 'singleton',
                start: currentTx.start
              }" />
          </mm-wavesurfer-regions>
        </mm-wavesurfer>

        <ng-container
          *ngIf="status.working?.on !== 'transcription'; else transcribing">
          <nav class="tabs">
            <tui-tabs
              (activeItemIndexChange)="onSwitchTab($event)"
              [(activeItemIndex)]="state.tabIndex">
              <button [disabled]="!configured" tuiTab>Details</button>
              <button [disabled]="!configured" tuiTab>
                Transcription
                <tui-badge
                  class="tui-space_bottom-2"
                  size="xs"
                  status="primary"
                  [value]="minutes.numSpeakers"></tui-badge>
              </button>
              <button [disabled]="!configured" tuiTab>Summary</button>
              <button [disabled]="!configured" tuiTab>Preview</button>
              <div style="flex: 2"></div>
              <button tuiTab>
                <tui-svg src="tuiIconSettings"></tui-svg>
                Settings
              </button>
            </tui-tabs>
          </nav>

          <mm-metadata
            [ngClass]="{
              data: true,
              showing: configured && state.tabIndex === 0
            }"
            [minutes]="minutes" />

          <mm-transcription
            (selected)="onTranscription($event)"
            [currentTx]="currentTx"
            [duration]="minutes.audio.duration"
            [ngClass]="{
              data: true,
              showing: configured && state.tabIndex === 1
            }"
            [status]="status"
            [transcription]="transcription$ | async"
            mmHydrator />

          <tui-loader
            [ngClass]="{
              data: true,
              showing: configured && state.tabIndex === 2
            }"
            [showLoader]="status.working?.on === 'summary'">
            <mm-summary [status]="status" [summary]="summary$ | async" />
          </tui-loader>

          <mm-preview
            [ngClass]="{
              data: true,
              showing: configured && state.tabIndex === 3
            }"
            [minutes]="minutes" />

          <mm-config
            [ngClass]="{
              data: true,
              showing: !configured || state.tabIndex === 4
            }"
            [config]="config$ | async" />
        </ng-container>

        <footer *ngIf="!!status.working" class="footer">
          <label class="progress" tuiProgressLabel>
            {{ status.status }}
            <progress tuiProgressBar [max]="100"></progress>
          </label>
          <button
            *ngIf="status.working.canceledBy"
            (click)="onCancelAction()"
            appearance="mono"
            class="canceler"
            size="xs"
            icon="tuiIconClose"
            tuiButton>
            Cancel
          </button>
        </footer>
      </main>

      <ng-template #transcribing>
        <tui-block-status>
          <img tuiSlot="top" src="./assets/meeting.png" />

          <h4>Transcription in progress ...</h4>

          <p>
            Speech-to-text transcription typically processes audio at 2x
            realtime, although performance is not linear for very short or very
            long recordings.
          </p>

          <p>
            This transcription should take about
            <b>
              {{
                dayjs()
                  .add(minutes.audio.duration / 2, 'second')
                  .fromNow(true)
              }}
            </b>
            and complete at approximately
            <b>
              {{
                dayjs(minutes.transcriptionStart)
                  .add(minutes.audio.duration / 2, 'second')
                  .format('hh:mm a')
              }}
            </b>
            .
          </p>

          <p>
            While it is running, the app can be closed or work can be performed
            on another set of minutes. When these minutes are opened again, the
            current progress will be shown.
          </p>

          <p>
            The transcription can be canceled at anytime from the status bar
            below.
          </p>
        </tui-block-status>
      </ng-template>
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
  @Select(ConfigState.configured) configured$: Observable<boolean>;
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;
  @Select(StatusState) status$: Observable<StatusStateModel>;
  @Select(MinutesState.summary) summary$: Observable<Summary[]>;
  @Select(MinutesState.transcription) transcription$: Observable<
    (AgendaItem | Transcription)[]
  >;

  @ViewChild(WaveSurferComponent) wavesurfer;

  configured: boolean;
  currentTx: Transcription = null;
  dayjs = dayjs;
  state: ComponentStateModel;
  status: StatusStateModel = StatusState.defaultStatus();

  #controller = inject(ControllerService);
  #destroyRef = inject(DestroyRef);
  #store = inject(Store);
  #timeupdate$ = new Subject<number>();

  constructor() {
    // 👇 initialize the component state
    this.state = deepCopy(
      this.#store.selectSnapshot<ComponentStateModel>(ComponentState)
    );
    // 👇 monitor state changes
    this.#monitorConfigState();
    this.#monitorStatus();
    this.#monitorWaveSurfer();
  }

  // 👇 Chrome has default undo/redo handlers for inputs and textareas
  //    we must use our own undo stack instead

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

  onCancelAction(): void {
    this.#controller.cancelWorking(this.status.working);
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

  onTranscription(tx: Transcription): void {
    this.currentTx = tx;
    this.wavesurfer.wavesurfer.setTime(tx.start);
  }

  openMinutes(): void {
    this.#controller.openMinutes();
  }

  #monitorConfigState(): void {
    // 👇 make sure we are sufficiently configured
    this.configured$
      .pipe(takeUntilDestroyed(this.#destroyRef), delay(0))
      .subscribe((configured) => {
        this.configured = configured;
        // 👇 force "settings" tab if not configured
        if (!configured) this.state.tabIndex = 4;
      });
  }

  #monitorStatus(): void {
    // 👇 induce a delay to prevent Angular change detection errors
    this.status$
      .pipe(takeUntilDestroyed(this.#destroyRef), delay(0))
      .subscribe((status) => {
        this.status = status;
      });
  }

  // 👇 update the current tx as the waveform plays
  #monitorWaveSurfer(): void {
    this.#timeupdate$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        throttleTime(Constants.timeupdateThrottleInterval),
        map((ts: number) => {
          const minutes = this.#store.selectSnapshot<Minutes>(MinutesState);
          return minutes.transcription.find(
            (tx) => tx.type === 'TX' && ts >= tx.start && ts < tx.end
          );
        }),
        distinctUntilChanged()
      )
      .subscribe((tx: Transcription) => {
        this.currentTx = tx;
      });
  }
}
