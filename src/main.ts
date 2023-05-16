import { RootModule } from './app/module';

import { environment } from './app/environment';

import * as Sentry from '@sentry/angular-ivy';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

if (environment.production) enableProdMode();

platformBrowserDynamic()
  .bootstrapModule(RootModule)
  .catch((error) => {
    console.error(error);
    Sentry.captureException(error);
  });
