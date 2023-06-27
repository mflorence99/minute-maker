import * as Sentry from '@sentry/angular-ivy';

import { AppState } from '#mm/state/app';
import { AutosizeModule } from 'ngx-autosize';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ConfigState } from '#mm/state/config';
import { ErrorHandler } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MinutesState } from '#mm/state/minutes';
import { NgModule } from '@angular/core';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { RecentsState } from '#mm/state/recents';
import { RootPage } from '#mm/pages/root/page';
import { RouterModule } from '@angular/router';
import { StatusState } from '#mm/state/status';
import { STORAGE_ENGINE } from '@ngxs/storage-plugin';
import { StorageEngine } from '#mm/state/storage-engine';
import { TranscriptionComponent } from '#mm/components/transcription';
import { WaveSurferComponent } from '#mm/components/wavesurfer';
import { WaveSurferRegionComponent } from '#mm/components/wavesurfer-region';
import { WaveSurferRegionsComponent } from '#mm/components/wavesurfer-regions';
import { WaveSurferTimelineComponent } from '#mm/components/wavesurfer-timeline';

import { faRedo } from '@fortawesome/pro-duotone-svg-icons';
import { faTriangle } from '@fortawesome/pro-solid-svg-icons';
import { faUndo } from '@fortawesome/pro-duotone-svg-icons';

import isDev from '#mm/is-dev';

const COMPONENTS = [
  TranscriptionComponent,
  WaveSurferComponent,
  WaveSurferRegionComponent,
  WaveSurferRegionsComponent,
  WaveSurferTimelineComponent
];

const DIRECTIVES = [];

const PAGES = [RootPage];

const ROUTES = [];

const STATES = [AppState, ConfigState, MinutesState, RecentsState, StatusState];
const STATES_SAVED = [AppState, ConfigState, RecentsState];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...DIRECTIVES, ...PAGES],

  imports: [
    AutosizeModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    MatButtonModule,
    NgxsModule.forRoot(STATES, {
      developmentMode: isDev
    }),
    NgxsReduxDevtoolsPluginModule.forRoot({
      disabled: !isDev
    }),
    NgxsRouterPluginModule.forRoot(),
    NgxsStoragePluginModule.forRoot({
      key: STATES_SAVED
    }),
    NgxsLoggerPluginModule.forRoot({ collapsed: false }),
    RouterModule.forRoot(ROUTES)
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
export class RootModule {
  constructor(library: FaIconLibrary) {
    // 👇 must add icons we use right here
    library.addIcons(faRedo, faTriangle, faUndo);
  }
}
