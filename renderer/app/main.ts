import * as Sentry from '@sentry/angular-ivy';

import { ENV } from '#mm/common';
import { RootModule } from '#mm/module';
import { StorageEngine } from '#mm/state/storage-engine';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import isDev from '#mm/is-dev';

if (!isDev) enableProdMode();

// 👇 log the ENV
if (!isDev) console.log('%cPRODUCTION', 'color: darkorange');
else console.log('%cDEVELOPMENT', 'color: dodgerblue');
console.table(ENV);

// 👉 initialize Sentry.io
if (!isDev) {
  Sentry.init({
    debug: true,
    dsn: 'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
    release: `Minute Maker v${ENV.package.version}`
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
