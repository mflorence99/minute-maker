import { SetPosition } from './window';
import { SetSize } from './window';
import { WindowState } from './window';
import { WindowStateModel } from './window';

import 'jest-extended';

import { NgxsModule } from '@ngxs/store';
import { PhysicalPosition } from '@tauri-apps/api/window';
import { PhysicalSize } from '@tauri-apps/api/window';
import { Store } from '@ngxs/store';
import { TestBed } from '@angular/core/testing';

import { clearMocks } from '@tauri-apps/api/mocks';
import { mockIPC } from '@tauri-apps/api/mocks';

/* 👇 this is how IPC calls are mocked
  {
    cmd: 'tauri',
    args: {
      __tauriModule: 'Window',
      message: {
        cmd: 'manage',
        data: {
          cmd: {
            type: 'outerPosition'
          }
        }
      }
    }
  }
*/

const theInnerSize = new PhysicalSize(10, 20);
const theOuterSize = new PhysicalSize(30, 40);
const thePosition = new PhysicalPosition(100, 200);

describe('WindowState', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([WindowState])]
    });
    // 🔥 mock up the responses to the wundow calls
    mockIPC((cmd: string, args: any) => {
      const action = `${cmd}.${args.__tauriModule}.${args.message.data?.cmd?.type}`;
      switch (action) {
        case 'tauri.Window.innerSize':
          return Promise.resolve(theInnerSize);
        case 'tauri.Window.outerSize':
          return Promise.resolve(theOuterSize);
        case 'tauri.Window.outerPosition':
          return Promise.resolve(thePosition);
        default:
          return Promise.resolve(undefined);
      }
    });
  });

  afterEach(() => clearMocks());

  it('can set window position', () => {
    const store = TestBed.inject(Store);
    store.dispatch(new SetPosition(thePosition));
    const state = store.selectSnapshot<WindowStateModel>(WindowState);
    expect(state.position.x).toBe(thePosition.x);
    expect(state.position.y).toBe(thePosition.y);
  });

  it('can set window size', () => {
    const store = TestBed.inject(Store);
    store.dispatch(new SetSize(theInnerSize, theOuterSize));
    const state = store.selectSnapshot<WindowStateModel>(WindowState);
    expect(state.innerSize.width).toBe(theInnerSize.width);
    expect(state.innerSize.height).toBe(theInnerSize.height);
    expect(state.outerSize.width).toBe(theOuterSize.width);
    expect(state.outerSize.height).toBe(theOuterSize.height);
  });

  it('invokes callbacks on window move and resize', (done) => {
    const store = TestBed.inject(Store);
    const window = TestBed.inject(WindowState);
    // 👇 the state will eventually change
    store.select(WindowState).subscribe((state) => {
      expect(state.position.x).toBe(thePosition.x);
      expect(state.position.y).toBe(thePosition.y);
      expect(state.innerSize.width).toBe(theInnerSize.width);
      expect(state.innerSize.height).toBe(theInnerSize.height);
      expect(state.outerSize.width).toBe(theOuterSize.width);
      expect(state.outerSize.height).toBe(theOuterSize.height);
      done();
    });
    // 👇 invoke onMoved and inResized callbacks directly
    const ctx = {
      getState: (): WindowStateModel => ({
        innerSize: { height: 0, width: 0 },
        outerSize: { height: 0, width: 0 },
        position: { x: 0, y: 0 }
      })
    };
    window.onMovedHandler(ctx as any);
    window.onResizedHandler(ctx as any);
  });
});
