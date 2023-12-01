import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

export class SetPathToMinutes {
  static readonly type = '[App] SetPathToMinutes';
  constructor(public pathToMinutes: string) {}
}

export type AppStateModel = {
  pathToMinutes: string;
};

export function defaultApp(): AppStateModel {
  return {
    pathToMinutes: null
  };
}

@State<AppStateModel>({
  name: 'app',
  defaults: defaultApp()
})
@Injectable()
export class AppState {
  //

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SetPathToMinutes
  // //////////////////////////////////////////////////////////////////////////

  @Action(SetPathToMinutes) setPathToMinutes(
    { setState }: StateContext<AppStateModel>,
    { pathToMinutes }: SetPathToMinutes
  ): void {
    setState({ pathToMinutes });
  }
}
