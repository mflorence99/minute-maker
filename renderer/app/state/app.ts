import * as Sentry from '@sentry/angular-ivy';

import { Action } from '@ngxs/store';
import { AddRecent } from '#mm/state/recents';
import { DialogService } from '#mm/services/dialog';
import { ENV } from '#mm/common';
import { FSService } from '#mm/services/fs';
import { Injectable } from '@angular/core';
import { MetadataService } from '#mm/services/metadata';
import { Minutes } from '#mm/common';
import { MinutesSchema } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { NgxsOnInit } from '@ngxs/store';
import { SetMinutes } from '#mm/state/minutes';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { UploaderService } from '#mm/services/uploader';

import { debounceTime } from 'rxjs';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { patch } from '@ngxs/store/operators';
import { v4 as uuidv4 } from 'uuid';

export class NewMinutes {
  static readonly type = '[App] NewMinutes';
  constructor() {}
}

export class OpenMinutes {
  static readonly type = '[App] OpenMinutes';
  constructor() {}
}

export type AppStateModel = {
  bucketName: string;
  pathToMinutes: string;
};

@State<AppStateModel>({
  name: 'app',
  defaults: {
    bucketName: 'staging.washington-app-319514.appspot.com',
    pathToMinutes: undefined
  }
})
@Injectable()
export class AppState implements NgxsOnInit {
  #dialog = inject(DialogService);
  #fs = inject(FSService);
  #metadata = inject(MetadataService);
  #store = inject(Store);
  #uploader = inject(UploaderService);

  @Action(NewMinutes) async newMinutes(
    ctx: StateContext<AppStateModel>
  ): Promise<void> {
    // 🔥 locked into MP3 only for now
    const path = await this.#fs.chooseFile({
      defaultPath: ctx.getState().pathToMinutes,
      filters: [{ extensions: ['mp3'], name: 'Audio Recording' }],
      title: 'Open Audio Recording'
    });
    if (path) {
      const upload = await this.#uploader.upload({
        bucketName: ctx.getState().bucketName,
        destFileName: `${uuidv4()}.mp3`,
        filePath: path
      });
      console.log(upload);
      const metadata = await this.#metadata.parseFile(path);
      console.log(metadata);
    }
  }

  @Action(OpenMinutes) async openMinutes(
    ctx: StateContext<AppStateModel>
  ): Promise<void> {
    const path = await this.#fs.chooseFile({
      defaultPath: ctx.getState().pathToMinutes,
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
