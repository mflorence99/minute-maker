import { Action } from '@ngxs/store';
import { Channels } from '#mm/common';
import { ENV } from '#mm/common';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { Observable } from 'rxjs';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import { catchError } from 'rxjs';
import { from } from 'rxjs';
import { insertItem } from '@ngxs/store/operators';
import { map } from 'rxjs';
import { of } from 'rxjs';
import { removeItem } from '@ngxs/store/operators';

// 👇 we SHOULD be calling FSService, but we can't inject it
//    here as the "minutes" selector must be static
declare const ipc /* 🔥 typeof ipcRenderer */;

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
  @Action(AddRecent) addRecent(
    ctx: StateContext<RecentsStateModel>,
    action: AddRecent
  ): void {
    const recents = ctx.getState();
    // 👇 trim list if full
    if (recents.length >= ENV.settings.maxRecentPaths)
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

  @Selector() static minutes(
    recents: RecentsStateModel
  ): Observable<Minutes>[] {
    // 👇 the first entry is always "this one"
    //    so quick exit unless there are 2 or more
    if (recents.length <= 1) return [];
    // 👇 watch out: must process minutes as an observable
    const paths = recents.slice(1);
    return paths.map(
      (path): Observable<Minutes> =>
        from(ipc.invoke(Channels.fsLoadFile, path)).pipe(
          map((raw: string) => JSON.parse(raw)),
          catchError(() => of(null))
        )
    );
  }
}
