import { Action } from '@ngxs/store';
import { AddRecent } from '#mm/state/recents';
import { ClearStatus } from '#mm/state/status';
import { ConfigState } from '#mm/state/config';
import { Constants } from '#mm/common';
import { DialogService } from '#mm/services/dialog';
import { FSService } from '#mm/services/fs';
import { Injectable } from '@angular/core';
import { MetadataService } from '#mm/services/metadata';
import { Minutes } from '#mm/common';
import { MinutesSchema } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { NgxsOnInit } from '@ngxs/store';
import { SetMinutes } from '#mm/state/minutes';
import { SetStatus } from '#mm/state/status';
import { State } from '@ngxs/store';
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
  pathToMinutes: string;
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
  #metadata = inject(MetadataService);
  #store = inject(Store);
  #uploader = inject(UploaderService);

  @Action(NewMinutes) async newMinutes({ getState }): Promise<void> {
    // 🔥 locked into MP3 only for now
    const path = await this.#fs.chooseFile({
      defaultPath: getState().pathToMinutes,
      filters: [{ extensions: ['mp3'], name: 'Audio Recording' }],
      title: 'Open Audio Recording'
    });
    if (path) {
      this.#store.dispatch(
        new SetStatus({ status: 'Uploading audio recording', working: true })
      );
      try {
        // 👇 we'll use the snapshot b/c who knows where we are now
        const config = this.#store.selectSnapshot(ConfigState);
        // 👇 extract the audio metadata
        const metadata = await this.#metadata.parseFile(path);
        console.log(metadata);
        // 👇 upload the audio to GCS
        const upload = await this.#uploader.upload({
          bucketName: config.bucketName,
          destFileName: `${uuidv4()}.mp3`,
          filePath: path
        });
        console.log(upload);
      } catch (error) {
        this.#store.dispatch(new SetStatus({ error }));
      } finally {
        this.#store.dispatch(new ClearStatus());
      }
    }
  }

  @Action(OpenMinutes) async openMinutes({
    getState,
    setState
  }): Promise<void> {
    const path = await this.#fs.chooseFile({
      defaultPath: getState().pathToMinutes,
      filters: [{ extensions: ['json'], name: 'Minutes' }],
      title: 'Open Minutes'
    });
    if (path) {
      setState(patch({ pathToMinutes: path }));
      this.#loadMinutes(path);
    }
  }

  ngxsOnInit({ getState }): void {
    // 👇 load the last-used minutes, if any
    const path = getState().pathToMinutes;
    if (path) this.#loadMinutes(path);
    // 👇 save the minutes periodically
    const minutes$ = this.#store.select(MinutesState);
    minutes$
      .pipe(
        map((minutes) => {
          // 👇 we'll use the snapshot b/c who knows where we are now
          const state = this.#store.selectSnapshot(AppState);
          return [minutes, state.pathToMinutes];
        }),
        filter(([minutes, path]) => !!(minutes && path)),
        debounceTime(Constants.saveFileInterval)
      )
      .subscribe(([minutes, path]) => {
        this.#fs.saveFile(path, JSON.stringify(minutes, null, 2));
      });
  }

  async #loadMinutes(path: string): Promise<void> {
    try {
      const raw = await this.#fs.loadFile(path);
      const minutes: Minutes = MinutesSchema.parse(JSON.parse(raw));
      this.#store.dispatch([new SetMinutes(minutes), new AddRecent(path)]);
    } catch (error: any) {
      this.#dialog.showErrorBox(
        'Invalid Minutes Project File',
        `The file must be valid JSON, as created by this application.`
      );
    }
  }
}
