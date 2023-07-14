import * as Sentry from '@sentry/angular-ivy';

import { AppState } from '#mm/state/app';
import { AutosizeModule } from 'ngx-autosize';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ConfigState } from '#mm/state/config';
import { DateTimeTransformer } from '#mm/services/datetime-transformer';
import { ErrorHandler } from '@angular/core';
import { InsertableDirective } from '#mm/directives/insertable';
import { JoinableDirective } from '#mm/directives/joinable';
import { MarkdownModule } from 'ngx-markdown';
import { MenuService } from '#mm/services/menu';
import { MetadataComponent } from '#mm/components/metadata';
import { MinutesState } from '#mm/state/minutes';
import { NgModule } from '@angular/core';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { ReactiveFormsModule } from '@angular/forms';
import { RecentsState } from '#mm/state/recents';
import { RemovableDirective } from '#mm/directives/removable';
import { RephraseableDirective } from '#mm/directives/rephraseable';
import { RootPage } from '#mm/pages/root';
import { SplittableDirective } from '#mm/directives/splittable';
import { StatusState } from '#mm/state/status';
import { STORAGE_ENGINE } from '@ngxs/storage-plugin';
import { StorageEngine } from '#mm/state/storage-engine';
import { SummaryComponent } from '#mm/components/summary';
import { TranscriptionComponent } from '#mm/components/transcription';
import { TUI_DATE_FORMAT } from '@taiga-ui/cdk';
import { TUI_DATE_SEPARATOR } from '@taiga-ui/cdk';
import { TUI_DATE_TIME_VALUE_TRANSFORMER } from '@taiga-ui/kit';
import { TUI_FIRST_DAY_OF_WEEK } from '@taiga-ui/core';
import { TuiBlockStatusModule } from '@taiga-ui/layout';
import { TuiButtonModule } from '@taiga-ui/core';
import { TuiDayOfWeek } from '@taiga-ui/cdk';
import { TuiInputDateTimeModule } from '@taiga-ui/kit';
import { TuiInputModule } from '@taiga-ui/kit';
import { TuiLoaderModule } from '@taiga-ui/core';
import { TuiRootModule } from '@taiga-ui/core';
import { TuiSvgModule } from '@taiga-ui/core';
import { TuiTabsModule } from '@taiga-ui/kit';
import { UndoState } from '#mm/state/undo';
import { WaveSurferComponent } from '#mm/components/wavesurfer';
import { WaveSurferRegionComponent } from '#mm/components/wavesurfer-region';
import { WaveSurferRegionsComponent } from '#mm/components/wavesurfer-regions';
import { WaveSurferTimelineComponent } from '#mm/components/wavesurfer-timeline';

import isDev from '#mm/is-dev';

const COMPONENTS = [
  MetadataComponent,
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
    ReactiveFormsModule,
    TuiBlockStatusModule,
    TuiButtonModule,
    TuiInputDateTimeModule,
    TuiInputModule,
    TuiLoaderModule,
    TuiRootModule,
    TuiSvgModule,
    TuiTabsModule
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
    },
    { provide: TUI_DATE_FORMAT, useValue: 'MDY' },
    { provide: TUI_DATE_SEPARATOR, useValue: '/' },
    {
      provide: TUI_DATE_TIME_VALUE_TRANSFORMER,
      useClass: DateTimeTransformer
    },
    {
      provide: TUI_FIRST_DAY_OF_WEEK,
      useValue: TuiDayOfWeek.Sunday
    }
  ]
})
export class RootModule {
  constructor(private menu: MenuService) {}
}
