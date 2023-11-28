import * as Sentry from '@sentry/angular-ivy';

import { AppState } from '#mm/state/app';
import { AutofocusDirective } from '#mm/directives/autofocus';
import { AutosizeModule } from 'ngx-autosize';
import { BadgesComponent } from '#mm/components/badges';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ComponentState } from '#mm/state/component';
import { ConfigComponent } from '#mm/components/config';
import { ConfigState } from '#mm/state/config';
import { DateTimeTransformer } from '#mm/services/datetime-transformer';
import { DragDroppableDirective } from '#mm/directives/drag-droppable';
import { ErrorHandler } from '@angular/core';
import { ErrorHandler as CustomErrorHandler } from '#mm/services/error-handler';
import { EVENT_MANAGER_PLUGINS } from '@angular/platform-browser';
import { EventPluginsModule } from '@tinkoff/ng-event-plugins';
import { FindReplaceComponent } from '#mm/components/find-replace';
import { FindReplaceMatchDirective } from '#mm/components/find-replace';
import { HighlightDirective } from '#mm/directives/highlight';
import { HydratedDirective } from '#mm/directives/hydrated';
import { HydratorDirective } from '#mm/directives/hydrator';
import { InsertableDirective } from '#mm/directives/insertable';
import { IssuesComponent } from '#mm/components/issues';
import { IssuesState } from '#mm/state/issues';
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
import { PreviewComponent } from '#mm/components/preview';
import { ReactiveFormsModule } from '@angular/forms';
import { RecentsState } from '#mm/state/recents';
import { RemovableDirective } from '#mm/directives/removable';
import { RephraseableDirective } from '#mm/directives/rephraseable';
import { RootPage } from '#mm/pages/root';
import { SecurityContext } from '@angular/core';
import { SelectOnFocusDirective } from '#mm/directives/select-on-focus';
import { SplittableDirective } from '#mm/directives/splittable';
import { StatusState } from '#mm/state/status';
import { STORAGE_ENGINE } from '@ngxs/storage-plugin';
import { StorageEngine } from '#mm/state/storage-engine';
import { SummaryComponent } from '#mm/components/summary';
import { ThrottledEventPlugin } from '#mm/services/throttled-event';
import { TranscriptionComponent } from '#mm/components/transcription';
import { TUI_DATE_FORMAT } from '@taiga-ui/cdk';
import { TUI_DATE_SEPARATOR } from '@taiga-ui/cdk';
import { TUI_DATE_TIME_VALUE_TRANSFORMER } from '@taiga-ui/kit';
import { TUI_FIRST_DAY_OF_WEEK } from '@taiga-ui/core';
import { TuiAlertModule } from '@taiga-ui/core';
import { TuiBadgeModule } from '@taiga-ui/kit';
import { TuiBlockStatusModule } from '@taiga-ui/layout';
import { TuiButtonModule } from '@taiga-ui/core';
import { TuiCheckboxBlockModule } from '@taiga-ui/kit';
import { TuiDataListModule } from '@taiga-ui/core';
import { TuiDataListWrapperModule } from '@taiga-ui/kit';
import { TuiDayOfWeek } from '@taiga-ui/cdk';
import { TuiErrorModule } from '@taiga-ui/core';
import { TuiFieldErrorPipeModule } from '@taiga-ui/kit';
import { TuiHintModule } from '@taiga-ui/core';
import { TuiInputDateTimeModule } from '@taiga-ui/kit';
import { TuiInputModule } from '@taiga-ui/kit';
import { TuiInputNumberModule } from '@taiga-ui/kit';
import { TuiInputSliderModule } from '@taiga-ui/kit';
import { TuiInputTagModule } from '@taiga-ui/kit';
import { TuiLabelModule } from '@taiga-ui/core';
import { TuiLoaderModule } from '@taiga-ui/core';
import { TuiNotificationModule } from '@taiga-ui/core';
import { TuiProgressModule } from '@taiga-ui/kit';
import { TuiRadioBlockModule } from '@taiga-ui/kit';
import { TuiRadioModule } from '@taiga-ui/kit';
import { TuiRootModule } from '@taiga-ui/core';
import { TuiSelectModule } from '@taiga-ui/kit';
import { TuiSvgModule } from '@taiga-ui/core';
import { TuiTabsModule } from '@taiga-ui/kit';
import { TuiTextAreaModule } from '@taiga-ui/kit';
import { TuiTextfieldControllerModule } from '@taiga-ui/core';
import { TuiThemeNightModule } from '@taiga-ui/core';
import { UndoState } from '#mm/state/undo';
import { WaveSurferComponent } from '#mm/components/wavesurfer';
import { WaveSurferRegionComponent } from '#mm/components/wavesurfer-region';
import { WaveSurferRegionsComponent } from '#mm/components/wavesurfer-regions';
import { WaveSurferTimelineComponent } from '#mm/components/wavesurfer-timeline';

import isDev from '#mm/is-dev';

const COMPONENTS = [
  BadgesComponent,
  ConfigComponent,
  FindReplaceComponent,
  IssuesComponent,
  MetadataComponent,
  PreviewComponent,
  SummaryComponent,
  TranscriptionComponent,
  WaveSurferComponent,
  WaveSurferRegionComponent,
  WaveSurferRegionsComponent,
  WaveSurferTimelineComponent
];

const DIRECTIVES = [
  AutofocusDirective,
  DragDroppableDirective,
  FindReplaceMatchDirective,
  HighlightDirective,
  HydratedDirective,
  HydratorDirective,
  InsertableDirective,
  JoinableDirective,
  RemovableDirective,
  RephraseableDirective,
  SelectOnFocusDirective,
  SplittableDirective
];

const PAGES = [RootPage];

const PROVIDERS = [
  isDev
    ? {
        provide: ErrorHandler,
        useClass: CustomErrorHandler
      }
    : {
        provide: ErrorHandler,
        useValue: Sentry.createErrorHandler({
          logErrors: true,
          showDialog: true
        })
      },
  {
    provide: EVENT_MANAGER_PLUGINS,
    useClass: ThrottledEventPlugin,
    multi: true
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
];

const STATES = [
  AppState,
  ComponentState,
  ConfigState,
  IssuesState,
  MinutesState,
  RecentsState,
  StatusState,
  UndoState
];

const STATES_SAVED = [
  AppState,
  ComponentState,
  ConfigState,
  RecentsState,
  UndoState
];

const MODULES = [
  AutosizeModule,
  BrowserAnimationsModule,
  BrowserModule,
  CommonModule,
  EventPluginsModule,
  MarkdownModule.forRoot({
    sanitize: SecurityContext.NONE
  }),
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
  TuiAlertModule,
  TuiBadgeModule,
  TuiBlockStatusModule,
  TuiButtonModule,
  TuiCheckboxBlockModule,
  TuiDataListModule,
  TuiDataListWrapperModule,
  TuiErrorModule,
  TuiFieldErrorPipeModule,
  TuiHintModule,
  TuiInputDateTimeModule,
  TuiInputModule,
  TuiInputNumberModule,
  TuiInputSliderModule,
  TuiInputTagModule,
  TuiLabelModule,
  TuiLoaderModule,
  TuiNotificationModule,
  TuiProgressModule,
  TuiRadioBlockModule,
  TuiRadioModule,
  TuiRootModule,
  TuiSelectModule,
  TuiSvgModule,
  TuiTabsModule,
  TuiTextAreaModule,
  TuiTextfieldControllerModule,
  TuiThemeNightModule
];

@NgModule({
  bootstrap: [RootPage],
  declarations: [...COMPONENTS, ...DIRECTIVES, ...PAGES],
  imports: [...MODULES],
  providers: [...PROVIDERS]
})
export class RootModule {
  constructor(private menu: MenuService) {}
}
