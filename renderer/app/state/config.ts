import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

export class SetConfig {
  static readonly type = '[Config] SetConfig';
  constructor(public config: ConfigStateModel) {}
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
  //

  @Action(SetConfig) setConfig({ setState }, action: SetConfig): void {
    setState(action.config);
  }
}
