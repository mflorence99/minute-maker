import * as Sentry from '@sentry/angular-ivy';

import { RootModule } from '#mm/module';

import { enableProdMode } from '@angular/core';
import { environment } from '#mm/environment';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

if (environment.production) enableProdMode();

platformBrowserDynamic()
  .bootstrapModule(RootModule)
  .catch((error) => {
    console.error(`🔥 ${error.message}`);
    Sentry.captureException(error);
  });
