import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import { environment } from '#mm/environment';
import { insertItem } from '@ngxs/store/operators';
import { removeItem } from '@ngxs/store/operators';

export class AddRecent {
  static readonly type = '[Recents] AddRecent';
  constructor(public path: string) {}
}

export class ClearRecents {
  static readonly type = '[Recents] ClearRecents';
  constructor() {}
}

export type RecentsStateModel = string[];

@State<RecentsStateModel>({
  name: 'recents',
  defaults: []
})
@Injectable()
export class RecentsState {
  //

  @Action(AddRecent) addRecent(
    ctx: StateContext<RecentsStateModel>,
    action: AddRecent
  ): void {
    const recents = ctx.getState();
    // 👇 trim list if full
    if (recents.length >= environment.settings.maxRecentPaths)
      ctx.setState(removeItem(recents.length - 1));
    // 👇 remove any duplicate item
    const ix = recents.findIndex((recent) => recent === action.path);
    if (ix !== -1) ctx.setState(removeItem(ix));
    // 👇 put this one at the head
    ctx.setState(insertItem(action.path, 0));
  }

  @Action(ClearRecents) clearRecents(
    ctx: StateContext<RecentsStateModel>
  ): void {
    ctx.setState([]);
  }
}
