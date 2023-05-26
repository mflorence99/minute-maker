import { FsStorageEngine } from '../state/storage';

import { environment } from '../environment';

import * as Sentry from '@sentry/angular-ivy';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { forkJoin } from 'rxjs';
import { from } from 'rxjs';
import { invoke } from '@tauri-apps/api/tauri';
import { mergeMap } from 'rxjs';

export function initializeAppProvider(
  initializer: InitializerService
): Function {
  return (): Observable<any> => initializer.initialize();
}

@Injectable({ providedIn: 'root' })
export class InitializerService {
  initialize(): Observable<any> {
    // 👇 initialize the environment from Tauri
    // 🙈 https://github.com/tauri-apps/tauri/discussions/2873
    const envInitialized = invoke('get_environment_variable', {
      name: 'OPEN_AI_KEY'
    }).then((openAIKey) => {
      environment.env.OPEN_AI_KEY = openAIKey;
      // 👇 log the environment
      if (environment.production)
        console.log('%cPRODUCTION', 'color: darkorange');
      else console.log('%cLOCALHOST', 'color: dodgerblue');
      console.log(environment);
    });

    // 👉 initialize Sentry.io
    if (environment.production) {
      Sentry.init({
        debug: true,
        dsn: 'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
        release: `Minute Maker v${environment.package.version}`
      });
    }

    // 👉 initialize services
    return forkJoin([FsStorageEngine.initialize(), from(envInitialized)]).pipe(
      mergeMap(([state]) => this.#initializeWindowState(state))
    );
  }

  // 🔥 NOTE: we use this plugin now instead:
  //    https://github.com/tauri-apps/plugins-workspace/tree/v1/plugins/window-state
  #initializeWindowState(state: any): Observable<any> {
    /* if (state?.['window']) {
      const window = JSON.parse(state['window']);
      console.log(
        '%cWindow initialized:',
        'color: aqua',
        `inner[${window.innerSize.width}, ${window.innerSize.height}]wh`,
        `position[${window.position.x}, ${window.position.y}]xy`
      );
      return from(
        Promise.all([
          appWindow.setPosition(
            new PhysicalPosition(window.position.x, window.position.y)
          ),
          appWindow.setSize(
            new PhysicalSize(window.innerSize.width, window.innerSize.height)
          )
        ])
      );
    } else */ return from([state]);
  }
}
