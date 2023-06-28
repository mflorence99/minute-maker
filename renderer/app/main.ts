import * as Sentry from '@sentry/angular-ivy';

import { Constants } from '#mm/common';
import { Package } from '#mm/common';
import { RootModule } from '#mm/module';
import { StorageEngine } from '#mm/state/storage-engine';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import isDev from '#mm/is-dev';

if (!isDev) enableProdMode();

// 👇 log the environment

if (!isDev) console.log('%cPRODUCTION', 'color: darkorange');
else console.log('%cDEVELOPMENT', 'color: dodgerblue');
console.table(Package);
console.table(Constants);

// 👉 initialize Sentry.io

if (!isDev) {
  Sentry.init({
    debug: true,
    dsn: Constants.sentryDSN,
    release: `Minute Maker v${Package.version}`
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
