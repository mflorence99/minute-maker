import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

import { patch } from '@ngxs/store/operators';

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
    bucketName: 'staging.washington-app-319514.appspot.com'
  }
})
@Injectable()
export class ConfigState {
  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetConfig) setConfig({ setState }, {config}): void {
    setState(patch(config));
  }
}
