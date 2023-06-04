import * as Sentry from '@sentry/angular-ivy';

import { RootModule } from '#app/module';

import { enableProdMode } from '@angular/core';
import { environment } from '#app/environment';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

if (environment.production) enableProdMode();

platformBrowserDynamic()
  .bootstrapModule(RootModule)
  .catch((error) => {
    console.error(error);
    Sentry.captureException(error);
  });
