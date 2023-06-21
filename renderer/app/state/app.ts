import * as Sentry from '@sentry/angular-ivy';

import { Action } from '@ngxs/store';
import { AddRecent } from '#mm/state/recents';
import { DialogService } from '#mm/services/dialog';
import { ENV } from '#mm/common';
import { FSService } from '#mm/services/fs';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesSchema } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { NgxsOnInit } from '@ngxs/store';
import { SetMinutes } from '#mm/state/minutes';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { debounceTime } from 'rxjs';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { patch } from '@ngxs/store/operators';

export class LoadMinutes {
  static readonly type = '[App] LoadMinutes';
  constructor() {}
}

export type AppStateModel = {
  pathToMinutes: string | undefined;
};

@State<AppStateModel>({
  name: 'app',
  defaults: {
    pathToMinutes: null
  }
})
@Injectable()
export class AppState implements NgxsOnInit {
  #dialog = inject(DialogService);
  #fs = inject(FSService);
  #store = inject(Store);

  @Action(LoadMinutes) async loadMinutes(
    ctx: StateContext<AppStateModel>
  ): Promise<void> {
    const path = await this.#fs.chooseFile({
      filters: [{ extensions: ['json'], name: 'Minutes' }],
      title: 'Open Minutes'
    });
    if (path) {
      ctx.setState(patch({ pathToMinutes: path }));
      this.#loadMinutes(ctx, path);
    }
  }

  ngxsOnInit(ctx: StateContext<AppStateModel>): void {
    // 👇 load the last-used minutes, if any
    const path = ctx.getState().pathToMinutes;
    if (path) this.#loadMinutes(ctx, path);
    // 👇 save the minutes periodically
    const minutes$ = this.#store.select(MinutesState);
    minutes$
      .pipe(
        map((minutes) => [minutes, ctx.getState().pathToMinutes]),
        filter(([minutes, path]) => !!(minutes && path)),
        debounceTime(ENV.settings.saveFileInterval)
      )
      .subscribe(([minutes, path]) => {
        this.#fs.saveFile(path, JSON.stringify(minutes, null, 2));
      });
  }

  async #loadMinutes(
    ctx: StateContext<AppStateModel>,
    path: string
  ): Promise<void> {
    try {
      const raw = await this.#fs.loadFile(path);
      const minutes: Minutes = MinutesSchema.parse(JSON.parse(raw));
      ctx.dispatch(new SetMinutes(minutes));
      ctx.dispatch(new AddRecent(path));
    } catch (error: any) {
      console.error(`🔥 ${error.message}`);
      Sentry.captureException(error);
      // 👇 show an error message
      this.#dialog.showErrorBox(
        'Invalid Minutes Project File',
        `The file must be valid JSON, as created by this application.`
      );
    }
  }
}
