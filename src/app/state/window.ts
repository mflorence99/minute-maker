import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { NgxsOnInit } from '@ngxs/store';
import { PhysicalSize } from '@tauri-apps/api/window';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Subject } from 'rxjs';

import { appWindow } from '@tauri-apps/api/window';
import { debounceTime } from 'rxjs';
import { patch } from '@ngxs/store/operators';
import { skip } from 'rxjs';

type WindowLocation = { x: number; y: number };

type WindowSize = { height: number; width: number };

export class SetWindowLocation {
  static readonly type = '[Window] SetWindowLocation';
  constructor(public location: WindowLocation) {}
}

export class SetWindowSize {
  static readonly type = '[Window] SetWindowSize';
  constructor(public size: WindowSize) {}
}

export interface WindowStateModel {
  location: WindowLocation;
  size: WindowSize;
}

@State<WindowStateModel>({
  name: 'window',
  defaults: {
    location: { x: 0, y: 0 },
    size: { height: 0, width: 0 }
  }
})
@Injectable()
export class WindowState implements NgxsOnInit {
  #queue$ = new Subject();

  @Action(SetWindowLocation) setWindowLocation(
    ctx: StateContext<WindowStateModel>,
    action: SetWindowLocation
  ): void {
    ctx.setState(patch({ location: action.location }));
  }

  @Action(SetWindowSize) setWindowSize(
    ctx: StateContext<WindowStateModel>,
    action: SetWindowSize
  ): void {
    ctx.setState(patch({ size: action.size }));
  }

  ngxsOnInit(ctx: StateContext<WindowStateModel>): void {
    //
    const size = ctx.getState().size;
    if (size.height && size.width)
      appWindow.setSize(new PhysicalSize(size.width, size.height));
    console.log({ state: ctx.getState() });
    //
    this.#queue$.pipe(skip(1)).subscribe((action) => ctx.dispatch(action));

    // bindCallback(appWindow.listen.bind(appWindow))(TauriEvent.WINDOW_RESIZED)
    //   .pipe(debounceTime(250))
    //   .subscribe(
    //     (args) => console.log({ args })
    //     // ctx.dispatch(
    //     //   new SetWindowSize({ height: size.height, width: size.width })
    //     // )
    //   );

    appWindow.onResized(({ payload: size }) => {
      this.#queue$.next(
        new SetWindowSize({ height: size.height, width: size.width })
      );
    });
  }
}
