import * as Sentry from '@sentry/angular-ivy';

import { AppState } from '#mm/state/app';
import { AutosizeModule } from 'ngx-autosize';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ConfigState } from '#mm/state/config';
import { ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InsertableDirective } from '#mm/directives/insertable';
import { JoinableDirective } from '#mm/directives/joinable';
import { MarkdownModule } from 'ngx-markdown';
import { MinutesState } from '#mm/state/minutes';
import { NgModule } from '@angular/core';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { RecentsState } from '#mm/state/recents';
import { RemovableDirective } from '#mm/directives/removable';
import { RephraseableDirective } from '#mm/directives/rephraseable';
import { RootPage } from '#mm/pages/root/page';
import { SplittableDirective } from '#mm/directives/splittable';
import { StatusState } from '#mm/state/status';
import { STORAGE_ENGINE } from '@ngxs/storage-plugin';
import { StorageEngine } from '#mm/state/storage-engine';
import { SummaryComponent } from '#mm/components/summary';
import { TranscriptionComponent } from '#mm/components/transcription';
import { TuiButtonModule } from '@taiga-ui/core';
import { TuiRootModule } from '@taiga-ui/core';
import { TuiScrollbarModule } from '@taiga-ui/core';
import { TuiSvgModule } from '@taiga-ui/core';
import { TuiThemeNightModule } from '@taiga-ui/core';
import { UndoState } from '#mm/state/undo';
import { WaveSurferComponent } from '#mm/components/wavesurfer';
import { WaveSurferRegionComponent } from '#mm/components/wavesurfer-region';
import { WaveSurferRegionsComponent } from '#mm/components/wavesurfer-regions';
import { WaveSurferTimelineComponent } from '#mm/components/wavesurfer-timeline';

import isDev from '#mm/is-dev';

const COMPONENTS = [
  SummaryComponent,
  TranscriptionComponent,
  WaveSurferComponent,
  WaveSurferRegionComponent,
  WaveSurferRegionsComponent,
  WaveSurferTimelineComponent
];

const DIRECTIVES = [
  InsertableDirective,
  JoinableDirective,
  RemovableDirective,
  RephraseableDirective,
  SplittableDirective
];

const PAGES = [RootPage];

const STATES = [
  AppState,
  ConfigState,
  MinutesState,
  RecentsState,
  StatusState,
  UndoState
];
const STATES_SAVED = [AppState, ConfigState, RecentsState, UndoState];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...DIRECTIVES, ...PAGES],

  imports: [
    AutosizeModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    MarkdownModule.forRoot(),
    NgxsModule.forRoot(STATES, {
      developmentMode: isDev
    }),
    NgxsReduxDevtoolsPluginModule.forRoot({
      disabled: !isDev
    }),
    NgxsStoragePluginModule.forRoot({
      key: STATES_SAVED
    }),
    NgxsLoggerPluginModule.forRoot({ collapsed: false }),
    TuiButtonModule,
    TuiRootModule,
    TuiScrollbarModule,
    TuiSvgModule,
    TuiThemeNightModule
  ],

  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        logErrors: true,
        showDialog: false
      })
    },
    {
      provide: STORAGE_ENGINE,
      useClass: StorageEngine
    }
  ]
})
export class RootModule {}
