import * as Sentry from '@sentry/angular-ivy';

import { RootModule } from '#mm/module';
import { StorageEngine } from '#mm/state/storage-engine';

import { enableProdMode } from '@angular/core';
import { environment } from '#mm/environment';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

if (environment.production) enableProdMode();

// 👇 log the environment
if (environment.production) console.log('%cPRODUCTION', 'color: darkorange');
else console.log('%cDEVELOPMENT', 'color: dodgerblue');
console.table(environment);

// 👉 initialize Sentry.io
if (environment.production) {
  Sentry.init({
    debug: true,
    dsn: 'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
    release: `Minute Maker v${environment.package.version}`
  });
}

// 👇 make sure async storage engine is initialized BEFORE lauching Angular
//    this is the ONLY way that NGXS saved state works
StorageEngine.initialize()
  .then(() => {
    platformBrowserDynamic().bootstrapModule(RootModule);
  })
  .catch((error) => {
    console.error(`🔥 ${error.message}`);
    Sentry.captureException(error);
  });
