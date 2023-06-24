import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { UploaderService } from '#mm/services/uploader';

import { inject } from '@angular/core';
import { patch } from '@ngxs/store/operators';
import { switchMap } from 'rxjs';

export class SetConfig {
  static readonly type = '[Config] SetConfig';
  constructor(public config: Partial<ConfigStateModel>) {}
}

export type ConfigStateModel = {
  bucketName: string;
};

@State<ConfigStateModel>({
  name: 'config',
  defaults: {
    // 🔥 convenient just for now
    bucketName: 'washington-app-319514.appspot.com'
  }
})
@Injectable()
export class ConfigState implements NgxsOnInit {
  #store = inject(Store);
  #uploader = inject(UploaderService);

  @Selector() static bucketName(config: ConfigStateModel): string {
    return config.bucketName;
  }

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetConfig) setConfig({ setState }, { config }): void {
    setState(patch(config));
  }

  ngxsOnInit(): void {
    const bucketName$ = this.#store.select(ConfigState.bucketName);
    // 🙈 https://stackoverflow.com/questions/43881504/how-to-await-inside-rxjs-subscribe-method
    bucketName$
      .pipe(switchMap((bucketName) => this.#uploader.enableCORS(bucketName)))
      .subscribe();
  }
}
