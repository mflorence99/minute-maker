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
import { FindReplaceComponent } from '#mm/components/find-replace';
import { FindReplaceMatch } from '#mm/components/find-replace';
import { HostListener } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { Observable } from 'rxjs';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { Redo } from '#mm/state/undo';
import { Select } from '@ngxs/store';
import { SetComponentState } from '#mm/state/component';
import { SetMinutes } from '#mm/state/minutes';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import { TabIndex } from '#mm/state/component';
import { Transcription } from '#mm/common';
import { TuiAlertService } from '@taiga-ui/core';
import { Undo } from '#mm/state/undo';
import { UpdateFindReplace } from '#mm/state/minutes';
import { ViewChild } from '@angular/core';
import { WaveSurferComponent } from '#mm/components/wavesurfer';

import { combineLatest } from 'rxjs';
import { defaultStatus } from '#mm/state/status';
import { delay } from 'rxjs';
import { distinctUntilChanged } from 'rxjs';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { throttleTime } from 'rxjs';

import dayjs from 'dayjs';
import deepCopy from 'deep-copy';

@Component({
  selector: 'mm-root',
  template: `
    @if (minutes$ | async; as minutes) {
      <tui-root>
        <main>
          <header class="header">
            <h2>
              {{ minutes.subject }} &bull;
              {{ dayjs(minutes.date).format('MMMM D, YYYY') }}
            </h2>
            <pre>{{ (app$ | async).pathToMinutes }}</pre>
          </header>

          <mm-wavesurfer
            #wavesurfer
            (audioFileLoaded)="onAudioFileLoaded($event)"
            (timeupdate)="onTimeUpdate($event)"
            [audioFile]="minutes.audio.url"
            [options]="{ barGap: 2, barRadius: 2, barWidth: 2 }"
            class="wavesurfer">
            <mm-wavesurfer-regions>
              <!-- 👇 only one region that we update -->
              @if (currentTx) {
                <mm-wavesurfer-region
                  [params]="{
                    end: currentTx.end,
                    id: 'singleton',
                    start: currentTx.start
                  }" />
              }
            </mm-wavesurfer-regions>
          </mm-wavesurfer>

          @if (status.working?.on !== 'transcription') {
            <nav class="tabs">
              <!-- 🔥 tabs can only be referenced by number, not name so be sure to change the TabIndex enum if you change the tab order -->
              <tui-tabs
                (activeItemIndexChange)="onSwitchTab($event)"
                [(activeItemIndex)]="componentState.tabIndex">
                <button [disabled]="!configured" tuiTab>Details</button>
                <button [disabled]="!configured" tuiTab>Badges</button>
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
                showing:
                  configured && componentState.tabIndex === TabIndex.details
              }"
              [minutes]="minutes" />

            <mm-badges
              [ngClass]="{
                data: true,
                showing:
                  configured && componentState.tabIndex === TabIndex.badges
              }"
              [config]="config$ | async"
              [minutes]="minutes"
              [status]="status" />

            <mm-transcription
              (selected)="onTranscription($event)"
              [currentTx]="currentTx"
              [duration]="minutes.audio.duration"
              [match]="match"
              [minutes]="minutes$ | async"
              [ngClass]="{
                data: true,
                showing:
                  configured &&
                  componentState.tabIndex === TabIndex.transcription
              }"
              [status]="status"
              mmHydrator />

            <!-- 🔥 we don't strictly need to make the symmary hydrateable, but it makes autosize work on the textareas -->

            <tui-loader
              [ngClass]="{
                data: true,
                showing:
                  configured && componentState.tabIndex === TabIndex.summary
              }"
              [showLoader]="status.working?.on === 'summary'"
              mmHydrator>
              <mm-summary [minutes]="minutes$ | async" [status]="status" />
            </tui-loader>

            <mm-preview
              [ngClass]="{
                data: true,
                showing:
                  configured && componentState.tabIndex === TabIndex.preview
              }"
              [config]="config$ | async"
              [minutes]="minutes" />

            <mm-config
              [ngClass]="{
                data: true,
                showing:
                  !configured || componentState.tabIndex === TabIndex.settings
              }"
              [config]="config$ | async" />
          } @else {
            @if (transcriptionRate$ | async; as transcriptionRate) {
              <tui-block-status>
                <img tuiSlot="top" src="./assets/meeting.png" />

                <h4>Transcription in progress ...</h4>

                <p>
                  Speech-to-text transcription typically processes audio at
                  {{ transcriptionRate }}x realtime, although performance is not
                  linear for very short or very long recordings.
                </p>

                <p>
                  This transcription should take about
                  <b>
                    {{
                      dayjs()
                        .add(
                          minutes.audio.duration / transcriptionRate,
                          'second'
                        )
                        .fromNow(true)
                    }}
                  </b>
                  and complete at approximately
                  <b>
                    {{
                      dayjs(minutes.transcriptionStart)
                        .add(
                          minutes.audio.duration / transcriptionRate,
                          'second'
                        )
                        .format('hh:mm a')
                    }}
                  </b>
                  .
                </p>

                <p>
                  While it is running, the app can be closed or work can be
                  performed on another set of minutes. When these minutes are
                  opened again, the current progress will be shown.
                </p>

                <p>
                  The transcription can be canceled at anytime from the status
                  bar below.
                </p>
              </tui-block-status>
            }
          }

          <ng-container *ngTemplateOutlet="progress"></ng-container>
        </main>
      </tui-root>
    } @else {
      <main>
        <tui-block-status>
          <img tuiSlot="top" src="./assets/meeting.png" />

          <h4>To get started ...</h4>

          <p>
            These actions can be performed at anytime from the
            <b>File</b>
            menu.
          </p>

          <button
            (click)="newMinutes()"
            appearance="primary"
            size="m"
            tuiButton>
            New Minutes from MP3 Audio
          </button>

          <button
            (click)="openMinutes()"
            appearance="accent"
            size="m"
            tuiButton>
            Open Minutes JSON File
          </button>
        </tui-block-status>

        <ng-container *ngTemplateOutlet="progress"></ng-container>
      </main>
    }

    <ng-template #progress>
      @if (!!status.working) {
        <footer class="footer">
          <label class="progress" tuiProgressLabel>
            {{ status.status }}
            <progress tuiProgressBar [max]="100"></progress>
          </label>
          @if (status.working.canceledBy) {
            <button
              (click)="onCancelAction()"
              appearance="mono"
              class="canceler"
              size="xs"
              icon="tuiIconClose"
              tuiButton>
              Cancel
            </button>
          }
        </footer>
      }
    </ng-template>
  `
})
export class RootPage {
  @Select(AppState) app$: Observable<AppStateModel>;
  @Select(ComponentState) component$: Observable<ComponentStateModel>;
  @Select(ConfigState) config$: Observable<ConfigStateModel>;
  @Select(ConfigState.configured) configured$: Observable<boolean>;
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;
  @Select(StatusState) status$: Observable<StatusStateModel>;
  @Select(ConfigState.transcriptionRate)
  transcriptionRate$: Observable<number>;

  @ViewChild(WaveSurferComponent) wavesurfer;

  componentState: ComponentStateModel;
  configured: boolean;
  currentTx: Partial<Transcription>;
  dayjs = dayjs;
  match: FindReplaceMatch;
  status: StatusStateModel = defaultStatus();

  // 👇 just to reference the enum in the template
  // eslint-disable-next-line @typescript-eslint/member-ordering
  TabIndex: typeof TabIndex = TabIndex;

  #alerts = inject(TuiAlertService);
  #controller = inject(ControllerService);
  #destroyRef = inject(DestroyRef);
  #findReplace$: Subscription;
  #store = inject(Store);
  #timeupdate$ = new Subject<number>();

  constructor() {
    // 👇 initialize the component state
    this.componentState = deepCopy(
      this.#store.selectSnapshot<ComponentStateModel>(ComponentState)
    );
    // 👇 monitor state changes
    this.#monitorConfigState();
    this.#monitorFindReplace();
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

  onAudioFileLoaded(audio: HTMLAudioElement): void {
    this.#store.dispatch(
      // 👇 this is the duration of the waveform -- the time base
      //    in the audio control appears slighty different and must be corrected
      new SetMinutes({ audio: { wavelength: audio.duration } })
    );
  }

  onCancelAction(): void {
    this.#controller.cancelWorking(this.status.working);
  }

  onFindReplaceMatch(match: FindReplaceMatch): void {
    this.currentTx = { id: match.id };
    this.match = match;
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
        if (!configured) this.componentState.tabIndex = TabIndex.settings;
      });
  }

  #monitorFindReplace(): void {
    combineLatest({
      componentState: this.component$,
      minutes: this.minutes$
    })
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith({
          componentState:
            this.#store.selectSnapshot<ComponentStateModel>(ComponentState),
          minutes: this.#store.selectSnapshot(MinutesState)
        }),
        map(
          ({ componentState, minutes }) =>
            // 🔥 find/replace only works for transcriptions
            componentState.tabIndex === TabIndex.transcription &&
            !!minutes?.findReplace?.doFind
        ),
        distinctUntilChanged()
      )
      .subscribe((show) => this.#showHideReplace(show));
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
        throttleTime(Constants.timeupdateThrottleInterval, undefined, {
          leading: true,
          trailing: true
        }),
        // 👇 filter the very first time update, as we may be editing
        //    the transcription while a long audio loads -- NOTE: this isn't
        //    technically the "first" but it's very hard to select manually
        //    and is guaranteed to be emitted as audo load completes
        filter((ts: number) => ts !== 0),
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

  #showHideReplace(show: boolean): void {
    // 👇 never more than one showing -- none at all if hiding!
    if (this.#findReplace$) this.#findReplace$.unsubscribe();
    if (show) {
      const component = new PolymorpheusComponent(FindReplaceComponent);
      this.#findReplace$ = this.#alerts
        .open(component, {
          label: 'Search Transcription',
          autoClose: false
        })
        .subscribe({
          // 👇 this is the one way the doFind flag is reset:
          //    when the find-replace panel is closed
          complete: () =>
            this.#store.dispatch(new UpdateFindReplace({ doFind: false }))
        });
    }
    // 👇 cleanup subscription
    else this.#findReplace$ = null;
  }
}
