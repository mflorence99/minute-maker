import * as Sentry from '@sentry/angular-ivy';

import { APP_INITIALIZER } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ErrorHandler } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { InitializerService } from '#mm/services/initializer';
import { MatButtonModule } from '@angular/material/button';
import { NgModule } from '@angular/core';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { RootPage } from '#mm/pages/root/page';
import { RouterModule } from '@angular/router';
import { STORAGE_ENGINE } from '@ngxs/storage-plugin';
import { StorageEngine } from '#mm/state/storage-engine';
import { TranscriptionComponent } from '#mm/components/transcription';
import { WaveSurferComponent } from '#mm/components/wavesurfer';
import { WaveSurferRegionComponent } from '#mm/components/wavesurfer-region';
import { WaveSurferRegionsComponent } from '#mm/components/wavesurfer-regions';
import { WaveSurferTimelineComponent } from '#mm/components/wavesurfer-timeline';

import { environment } from '#mm/environment';
import { faTriangle } from '@fortawesome/pro-solid-svg-icons';
import { initializeAppProvider } from '#mm/services/initializer';

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

const STATES = [];
const STATES_SAVED = [];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...DIRECTIVES, ...PAGES],

  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    MatButtonModule,
    NgxsModule.forRoot(STATES, {
      developmentMode: !environment.production
    }),
    NgxsReduxDevtoolsPluginModule.forRoot({
      disabled: environment.production
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
      provide: APP_INITIALIZER,
      useFactory: initializeAppProvider,
      deps: [InitializerService],
      multi: true
    },
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
    library.addIcons(faTriangle);
  }
}
