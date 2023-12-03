import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
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
import { Issue } from '#mm/state/issues';
import { IssuesState } from '#mm/state/issues';
import { IssuesStateModel } from '#mm/state/issues';
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
import { WINDOW } from '@ng-web-apis/common';

import { combineLatest } from 'rxjs';
import { distinctUntilChanged } from 'rxjs';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { throttleTime } from 'rxjs';

import dayjs from 'dayjs';

@Component({
  selector: 'mm-root',
  template: `
    <tui-theme-night />

    <mm-sink
      #mm
      [app]="app$ | async"
      [componentState]="component$ | async"
      [config]="config$ | async"
      [configured]="configured$ | async"
      [issues]="issues$ | async"
      [minutes]="minutes$ | async"
      [status]="status$ | async"
      [transcriptionRate]="transcriptionRate$ | async" />

    <!-- 🟦 MINUTES AVAILABLE -->
    @if (mm.minutes) {
      <tui-root tuiMode="onDark">
        <main>
          <header class="header">
            <h2>
              {{ mm.minutes.subject }} &bull;
              {{ dayjs(mm.minutes.date).format('MMMM D, YYYY') }}
            </h2>
            <pre>{{ mm.app.pathToMinutes }}</pre>
          </header>

          <mm-wavesurfer
            #wavesurfer
            (audioFileLoaded)="onAudioFileLoaded($event)"
            (timeupdate)="onTimeUpdate($event)"
            [audioFile]="mm.minutes.audio.url"
            [options]="{ barGap: 2, barRadius: 2, barWidth: 2 }"
            class="wavesurfer">
            <mm-wavesurfer-regions>
              <!-- 👇 only one region that we update -->
              @if (currentTx) {
                <mm-wavesurfer-region
                  [params]="{
                    color: 'rgba(100, 100, 100, 0.5)',
                    end: currentTx.end,
                    id: 'singleton',
                    start: currentTx.start
                  }" />
              }
            </mm-wavesurfer-regions>
          </mm-wavesurfer>

          <!-- 🟫 NOT CURRENTLY TRANSCRIBING -->
          @if (mm.status.working?.on !== 'transcription') {
            <nav class="tabs">
              <!-- 🔥 tabs can only be referenced by number, not name so be sure to change the TabIndex enum if you change the tab order -->
              <tui-tabs
                #tabs
                (activeItemIndexChange)="onSwitchTab($event)"
                [activeItemIndex]="
                  mm.configured ? mm.componentState.tabIndex : TabIndex.settings
                ">
                <button [disabled]="!mm.configured" tuiTab>Details</button>
                <button [disabled]="!mm.configured" tuiTab>Badges</button>
                <button [disabled]="!mm.configured" tuiTab>
                  Transcription
                </button>
                <button
                  [disabled]="
                    !mm.configured || !mm.minutes.transcription.length
                  "
                  tuiTab>
                  Summary
                </button>
                <button [disabled]="!mm.configured" tuiTab>Preview</button>
                <button [disabled]="!mm.configured" tuiTab>
                  Issues
                  @if (mm.issues.length) {
                    <tui-badge
                      class="tui-space_bottom-2"
                      size="xs"
                      status="primary"
                      [value]="mm.issues.length"></tui-badge>
                  }
                </button>
                <div style="flex: 2"></div>
                <button tuiTab>
                  <tui-svg src="tuiIconSettings"></tui-svg>
                  Settings
                </button>
              </tui-tabs>
            </nav>

            <section
              [ngStyle]="{
                transform:
                  'translateX(calc(var(--w) * ' +
                  -(mm.configured
                    ? mm.componentState.tabIndex
                    : TabIndex.settings) +
                  '))'
              }"
              class="panels">
              <mm-metadata
                [ngStyle]="{ '--ix': TabIndex.details }"
                [minutes]="mm.minutes"
                class="panel" />

              <mm-badges
                [ngStyle]="{ '--ix': TabIndex.badges }"
                [config]="mm.config"
                [minutes]="mm.minutes"
                [status]="mm.status"
                class="panel" />

              <mm-transcription
                (selected)="onTranscription($event)"
                [currentTx]="currentTx"
                [match]="match"
                [minutes]="mm.minutes"
                [ngStyle]="{ '--ix': TabIndex.transcription }"
                [status]="mm.status"
                class="panel"
                mmHydrator />

              <!-- 🔥 we don't strictly need to make the summary hydrateable, but it makes autosize work on the textareas - also not perfect to eliminate summary if no transcription, but good enough -->

              <tui-loader
                [ngStyle]="{ '--ix': TabIndex.summary }"
                [showLoader]="mm.status.working?.on === 'summary'"
                class="panel"
                mmHydrator>
                @if (mm.minutes.transcription.length) {
                  <mm-summary [minutes]="mm.minutes" [status]="mm.status" />
                }
              </tui-loader>

              <mm-preview
                [ngStyle]="{ '--ix': TabIndex.preview }"
                [config]="mm.config"
                [minutes]="mm.minutes"
                class="panel" />

              <mm-issues
                (selected)="onIssue($event)"
                [ngStyle]="{ '--ix': TabIndex.issues }"
                [issues]="mm.issues"
                class="panel" />

              <mm-config
                [ngStyle]="{ '--ix': TabIndex.settings }"
                [config]="mm.config"
                class="panel" />
            </section>

            <!-- 🟩 TRANSCRIPTION IN PROGRESS -->
          } @else {
            <tui-block-status>
              <img tuiSlot="top" src="./assets/meeting.png" />

              <h4>Transcription in progress ...</h4>

              <p>
                Speech-to-text transcription typically processes audio at
                {{ mm.transcriptionRate }}x realtime, although performance is
                not linear for very short or very long recordings.
              </p>

              <p>
                This transcription should take about
                <b>
                  {{
                    dayjs()
                      .add(
                        mm.minutes.audio.duration / mm.transcriptionRate,
                        'second'
                      )
                      .fromNow(true)
                  }}
                </b>
                and complete at approximately
                <b>
                  {{
                    dayjs(mm.minutes.transcriptionStart)
                      .add(
                        mm.minutes.audio.duration / mm.transcriptionRate,
                        'second'
                      )
                      .format('hh:mma')
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
                The transcription can be canceled at anytime from the status bar
                below.
              </p>
            </tui-block-status>
          }

          <ng-container *ngTemplateOutlet="progress"></ng-container>
        </main>
      </tui-root>

      <!-- 🟥 MINUTES NOT YET READY -->
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

    <!-- 🟥 REUSABLE PROGRESSBAR -->
    <ng-template #progress>
      @if (!!mm.status.working) {
        <footer class="footer">
          <label class="progress" tuiProgressLabel>
            {{ mm.status.status }}
            <progress tuiProgressBar [max]="100"></progress>
          </label>
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
  @Select(IssuesState) issues$: Observable<IssuesStateModel>;
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;
  @Select(StatusState) status$: Observable<StatusStateModel>;
  @Select(ConfigState.transcriptionRate)
  transcriptionRate$: Observable<number>;

  @ViewChild(WaveSurferComponent) wavesurfer;

  currentTx: Partial<Transcription>;
  dayjs = dayjs;
  match: FindReplaceMatch;

  // 👇 just to reference the enum in the template
  // eslint-disable-next-line @typescript-eslint/member-ordering
  TabIndex: typeof TabIndex = TabIndex;

  #alerts = inject(TuiAlertService);
  #controller = inject(ControllerService);
  #destroyRef = inject(DestroyRef);
  #findReplace$: Subscription;
  #store = inject(Store);
  #timeupdate$ = new Subject<number>();
  #window = inject(WINDOW);

  constructor() {
    this.#monitorFindReplace();
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

  onFindReplaceMatch(match: FindReplaceMatch): void {
    this.currentTx = { id: match.id };
    this.match = match;
  }

  onIssue(issue: Issue): void {
    // 🔥 no programmatic way of setting tab!
    const buttons: NodeListOf<HTMLButtonElement> =
      this.#window.document.querySelectorAll('tui-tabs > button');
    buttons[issue.tabIndex].click();
    // 🔥 HACK -- we can;'t scroll to the transcription until
    //    the tab is switched properly
    if (issue.tx) setTimeout(() => this.onTranscription(issue.tx), 500);
  }

  onSwitchTab(tabIndex: number): void {
    this.#store.dispatch(new SetComponentState({ tabIndex }));
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
      .subscribe((show) => this.#showFindReplace(show));
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

  #showFindReplace(show: boolean): void {
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
