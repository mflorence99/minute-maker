import { environment } from '../environment';

import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { PhysicalPosition } from '@tauri-apps/api/window';
import { PhysicalSize } from '@tauri-apps/api/window';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';

import { appWindow } from '@tauri-apps/api/window';
import { debounceTime } from 'rxjs';
import { delay } from 'rxjs';
import { inject } from '@angular/core';
import { patch } from '@ngxs/store/operators';

import deepEqual from 'deep-equal';

// 🔥 we built this state so we could restore the window state
//    on app restart, then we discovered thus plugin:
//    https://github.com/tauri-apps/plugins-workspace/tree/v1/plugins/window-state

// 👇 so now this is just a reference implementation for state and state tests

export class SetPosition {
  static readonly type = '[Window] SetPosition';
  constructor(public position: PhysicalPosition) {}
}

export class SetSize {
  static readonly type = '[Window] SetSize';
  constructor(public innerSize: PhysicalSize, public outerSize: PhysicalSize) {}
}

export interface WindowStateModel {
  innerSize: Partial<PhysicalSize>;
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

  constructor() {
    const store = inject(Store);
    // 👇 dequeue move, resize actions
    this.#queue$
      .pipe(environment.production ? debounceTime(500) : delay(0))
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
    appWindow.onMoved(() => this.onMovedHandler(ctx));
    appWindow.onResized(() => this.onResizedHandler(ctx));
  }

  // 🔥 Tauri does not appear to fire move events!
  onMovedHandler(ctx: StateContext<WindowStateModel>): void {
    Promise.all([appWindow.outerPosition()]).then(([position]) => {
      console.log(
        '%cWindow moved:',
        'color: lime',
        `[${position.x}, ${position.y}]xy`
      );
      const state = ctx.getState();
      if (!deepEqual(state.position, position))
        this.#queue$.next(new SetPosition(position));
    });
  }

  onResizedHandler(ctx: StateContext<WindowStateModel>): void {
    Promise.all([appWindow.innerSize(), appWindow.outerSize()]).then(
      ([innerSize, outerSize]) => {
        console.log(
          '%cWindow resized:',
          'color: gold',
          `inner[${innerSize.width}, ${innerSize.height}]wh`,
          `outer[${outerSize.width}, ${outerSize.height}]wh`
        );
        const state = ctx.getState();
        if (
          !deepEqual(state.innerSize, innerSize) ||
          !deepEqual(state.outerSize, outerSize)
        )
          this.#queue$.next(new SetSize(innerSize, outerSize));
      }
    );
  }
}
