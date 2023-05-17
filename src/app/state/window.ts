import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { LogicalSize } from '@tauri-apps/api/window';
import { NgxsOnInit } from '@ngxs/store';
import { PhysicalPosition } from '@tauri-apps/api/window';
import { PhysicalSize } from '@tauri-apps/api/window';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';

import { appWindow } from '@tauri-apps/api/window';
import { debounceTime } from 'rxjs';
import { patch } from '@ngxs/store/operators';

import deepEqual from 'deep-equal';

export class SetPosition {
  static readonly type = '[Window] SetPosition';
  constructor(public position: PhysicalPosition) {}
}

export class SetSize {
  static readonly type = '[Window] SetSize';
  constructor(public innerSize: LogicalSize, public outerSize: PhysicalSize) {}
}

export interface WindowStateModel {
  innerSize: Partial<LogicalSize>;
  outerSize: Partial<PhysicalSize>;
  position: Partial<PhysicalPosition>;
}

@State<WindowStateModel>({
  name: 'window',
  defaults: {
    innerSize: { height: 0, width: 0 },
    outerSize: { height: 0, width: 0 },
    position: { x: 0, y: 0 }
  }
})
@Injectable()
export class WindowState implements NgxsOnInit {
  #queue$ = new Subject();

  constructor(store: Store) {
    // 👇 dequeue move, resize actions
    this.#queue$
      .pipe(debounceTime(500))
      .subscribe((action) => store.dispatch(action));
  }

  @Action(SetPosition) setPosition(
    ctx: StateContext<WindowStateModel>,
    action: SetPosition
  ): void {
    ctx.setState(patch({ position: action.position }));
  }

  @Action(SetSize) setSize(
    ctx: StateContext<WindowStateModel>,
    action: SetSize
  ): void {
    ctx.setState(
      patch({ innerSize: action.innerSize, outerSize: action.outerSize })
    );
  }

  ngxsOnInit(ctx: StateContext<WindowStateModel>): void {
    // 🔥 Tauri does not appear to fire move events!
    appWindow.onMoved(() => {
      Promise.all([appWindow.outerPosition()]).then(([position]) => {
        const state = ctx.getState();
        if (!deepEqual(state.position, position))
          this.#queue$.next(new SetPosition(position));
      });
    });
    // 👇 if the size has changed, record it
    appWindow.onResized(() => {
      Promise.all([appWindow.innerSize(), appWindow.outerSize()]).then(
        ([innerSize, outerSize]) => {
          const state = ctx.getState();
          if (
            !deepEqual(state.innerSize, innerSize) ||
            !deepEqual(state.outerSize, outerSize)
          )
            this.#queue$.next(new SetSize(innerSize, outerSize));
        }
      );
    });
  }
}
