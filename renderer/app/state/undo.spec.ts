import 'jest-extended';

import { Clear } from '#mm/state/undo';
import { Constants } from '#mm/common';
import { NgxsModule } from '@ngxs/store';
import { Redo } from '#mm/state/undo';
import { Stack } from '#mm/state/undo';
import { Store } from '@ngxs/store';
import { TestBed } from '@angular/core/testing';
import { Undo } from '#mm/state/undo';
import { UndoableAction } from '#mm/state/undo';
import { UndoState } from '#mm/state/undo';

class Doit extends UndoableAction {
  static readonly type = '[Undo-test] Doit';
  constructor(public x: number) {
    super(false);
  }
}

class Undoit extends UndoableAction {
  static readonly type = '[Undo-test] Undoit';
  constructor(public y: string) {
    super(false);
  }
}

let store: Store;
let undoState: UndoState;

const defaultState = {
  redoStack: [],
  undoStack: [[new Doit(1), new Undoit('x')]]
};

describe('ConfigState', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([UndoState])]
    });
    undoState = TestBed.inject(UndoState);
    store = TestBed.inject(Store);
    // 👇 set the store to its default state
    store.reset({ ...store.snapshot(), undo: defaultState });
  });

  it('responds to Clear', () => {
    expect(undoState.cando()).toStrictEqual([true, false]);
    store.dispatch(new Clear());
    expect(undoState.cando()).toStrictEqual([false, false]);
  });

  it('responds to Undo/Redo', () => {
    expect(undoState.cando()).toStrictEqual([true, false]);
    // 👇 undo
    store.dispatch(new Undo());
    expect(undoState.cando()).toStrictEqual([false, true]);
    let state = store.selectSnapshot(UndoState);
    expect(state.undoStack).toStrictEqual([]);
    expect(state.redoStack).toStrictEqual([[new Doit(1), new Undoit('x')]]);
    // 👇 undo
    store.dispatch(new Redo());
    expect(undoState.cando()).toStrictEqual([true, false]);
    state = store.selectSnapshot(UndoState);
    expect(state.undoStack).toStrictEqual([[new Doit(1), new Undoit('x')]]);
    expect(state.redoStack).toStrictEqual([]);
  });

  it('responds to Stack', () => {
    expect(undoState.cando()).toStrictEqual([true, false]);
    store.dispatch(new Clear());
    store.dispatch(new Stack([new Undoit('y'), new Doit(2)]));
    const state = store.selectSnapshot(UndoState);
    expect(state.undoStack).toStrictEqual([
      undoState.withType([new Undoit('y'), new Doit(2)])
    ]);
    expect(state.redoStack).toStrictEqual([]);
  });

  it('limits the depth of the undo stack', () => {
    store.dispatch(new Clear());
    let state = store.selectSnapshot(UndoState);
    expect(state.undoStack).toHaveLength(0);
    for (let i = 0; i < Constants.maxUndoStackDepth * 2; i++)
      store.dispatch(new Stack([new Undoit('y'), new Doit(2)]));
    state = store.selectSnapshot(UndoState);
    expect(state.undoStack).toHaveLength(Constants.maxUndoStackDepth);
  });
});
