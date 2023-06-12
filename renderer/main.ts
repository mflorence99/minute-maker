import * as Sentry from '@sentry/angular-ivy';

import { RootModule } from '#mm/module';
import { StorageEngine } from '#mm/state/storage-engine';

import { enableProdMode } from '@angular/core';
import { environment } from '#mm/environment';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

if (environment.production) enableProdMode();

StorageEngine.initialize()
  .then(() => {
    platformBrowserDynamic().bootstrapModule(RootModule);
  })
  .catch((error) => {
    console.error(`🔥 ${error.message}`);
    Sentry.captureException(error);
  });
