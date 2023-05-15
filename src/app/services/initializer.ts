import { environment } from '../environment';

import * as Sentry from '@sentry/angular-ivy';

import { EMPTY } from 'rxjs';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export function initializeAppProvider(
  initializer: InitializerService
): Function {
  return (): Observable<any> => initializer.initialize();
}

@Injectable({ providedIn: 'root' })
export class InitializerService {
  initialize(): Observable<any> {
    if (environment.production)
      console.log('%cPRODUCTION', 'color: darkorange');
    else console.log('%cLOCALHOST', 'color: dodgerblue');
    console.log(environment.package);

    // 👉 initialize Sentry.io
    if (environment.production) {
      Sentry.init({
        debug: true,
        dsn: 'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
        release: `Minute Maker v${environment.package.version}`
      });
    }

    return EMPTY;
  }
}
