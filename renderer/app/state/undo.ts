import { Action } from '@ngxs/store';
import { Constants } from '#mm/common';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { inject } from '@angular/core';
import { insertItem } from '@ngxs/store/operators';
import { patch } from '@ngxs/store/operators';
import { removeItem } from '@ngxs/store/operators';

export type Candoable = [canDo: boolean, canRedo: boolean];

export class CanDo {
  static readonly type = '[Undo] CanDo';
  constructor(public can: Candoable) {}
}

export class Clear {
  static readonly type = '[Undo] Clear';
  constructor() {}
}

export class Redo {
  static readonly type = '[Undo] Redo';
  constructor() {}
}

export class Stack {
  static readonly type = '[Undo] Stack';
  constructor(public undoable: Undoable) {}
}

export class Undo {
  static readonly type = '[Undo] Undo';
  constructor() {}
}

export class UndoableAction {
  constructor(public undoing: boolean) {}
}

export type Undoable = [doit: UndoableAction, undoit: UndoableAction];

export type UndoStateModel = {
  redoStack: Undoable[];
  undoStack: Undoable[];
};

@State<UndoStateModel>({
  name: 'undo',
  defaults: {
    redoStack: [],
    undoStack: []
  }
})
@Injectable()
export class UndoState {
  #store = inject(Store);

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 Clear
  // //////////////////////////////////////////////////////////////////////////

  @Action(Clear) clear({ setState }): void {
    setState({ redoStack: [], undoStack: [] });
    this.#store.dispatch(new CanDo(this.cando()));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 Redo
  // //////////////////////////////////////////////////////////////////////////

  @Action(Redo) redo({ getState, setState }): void {
    // 👇 quick return if nothing to redo
    if (getState().redoStack.length === 0) return;
    // 👇 execute the redo operation
    const [undoAction, redoAction] = getState().redoStack[0];
    setState(patch({ redoStack: removeItem(0) }));
    this.#store.dispatch(redoAction);
    // 👇 put the undo action onto its stack
    setState(patch({ undoStack: insertItem([undoAction, redoAction], 0) }));
    this.#store.dispatch(new CanDo(this.cando()));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 Stack
  // //////////////////////////////////////////////////////////////////////////

  @Action(Stack) stack({ getState, setState }, { undoable }): void {
    setState(patch({ redoStack: [] }));
    while (getState().undoStack.length >= Constants.maxUndoStackDepth)
      setState(
        patch({ undoStack: removeItem(getState().undoStack.length - 1) })
      );
    setState(patch({ undoStack: insertItem(this.withType(undoable), 0) }));
    this.#store.dispatch(new CanDo(this.cando()));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 Undo
  // //////////////////////////////////////////////////////////////////////////

  @Action(Undo) undo({ getState, setState }): void {
    // 👇 quick return if nothing to undo
    if (getState().undoStack.length === 0) return;
    // 👇 execute the undo operation
    const [undoAction, redoAction] = getState().undoStack[0];
    setState(patch({ undoStack: removeItem(0) }));
    this.#store.dispatch(undoAction);
    // 👇 put the redo action onto its stack
    setState(patch({ redoStack: insertItem([undoAction, redoAction], 0) }));
    this.#store.dispatch(new CanDo(this.cando()));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟦 Helper methods
  // //////////////////////////////////////////////////////////////////////////

  cando(): Candoable {
    const state = this.#store.selectSnapshot(UndoState);
    return [state.undoStack.length > 0, state.redoStack.length > 0];
  }

  // 🙈 https://stackoverflow.com/questions/61101108/ngxs-how-to-package-an-action-so-that-it-can-be-dispatched-remotely
  withType(undoable: any): any {
    return undoable.map((action) => {
      const type = action.__proto__.constructor.type;
      return { type, ...action };
    });
  }
}
