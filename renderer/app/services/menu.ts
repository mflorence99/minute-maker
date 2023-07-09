import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { MenuID } from '#mm/common';
import { Observable } from 'rxjs';
import { Redo } from '#mm/state/undo';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Undo } from '#mm/state/undo';
import { UndoState } from '#mm/state/undo';
import { UndoStateModel } from '#mm/state/undo';

import { inject } from '@angular/core';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class MenuService {
  @Select(UndoState) undo$: Observable<UndoStateModel>;

  #store = inject(Store);

  constructor() {
    this.#dispatch();
    this.#monitorUndoState();
  }

  #dispatch(): void {
    ipc.on(Channels.menuSelected, (event, id) => {
      switch (id) {
        case MenuID.redo:
          this.#store.dispatch(new Redo());
          break;
        case MenuID.undo:
          this.#store.dispatch(new Undo());
          break;
      }
    });
  }

  #monitorUndoState(): void {
    this.undo$.subscribe((state) => {
      ipc.send(Channels.menuEnable, {
        [MenuID.redo]: state.redoStack.length > 0,
        [MenuID.undo]: state.undoStack.length > 0
      });
    });
  }
}
