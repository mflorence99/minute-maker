/* eslint-disable @typescript-eslint/restrict-plus-operands */
// 🔥 sucks we have to do this 👆 but ngxs destructure appears untyped

import { Action } from '@ngxs/store';
import { Constants } from '#mm/common';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { Transcription } from '#mm/common';

import { insertItem } from '@ngxs/store/operators';
import { patch } from '@ngxs/store/operators';
import { removeItem } from '@ngxs/store/operators';
import { updateItem } from '@ngxs/store/operators';

class UndoableAction {
  constructor(public undoing: boolean) {}
}

export class CanDo {
  static readonly type = '[Minutes] CanDo';
  constructor(public canMinutes: boolean, public canRedo: boolean) {}
}

export class ClearStacks {
  static readonly type = '[Undo] ClearStacks';
  constructor() {}
}

export class JoinTranscriptions extends UndoableAction {
  static readonly type = '[Minutes] JoinTranscriptions';
  constructor(public ix: number, public iy: number, undoing = false) {
    super(undoing);
  }
}

export class Redo {
  static readonly type = '[Minutes] Redo';
  constructor() {}
}

export class SetMinutes {
  static readonly type = '[Minutes] SetMinutes';
  constructor(public minutes: Partial<Minutes>) {}
}

export class SplitTranscription extends UndoableAction {
  static readonly type = '[Minutes] SplitTranscription';
  constructor(public ix: number, public pos: number, undoing = false) {
    super(undoing);
  }
}

export class Undo {
  static readonly type = '[Minutes] Undo';
  constructor() {}
}

export class UpdateTranscription extends UndoableAction {
  static readonly type = '[Minutes] UpdateTranscription';
  constructor(
    public transcription: Partial<Transcription>,
    public ix: number,
    undoing = false
  ) {
    super(undoing);
  }
}

export type MinutesStateModel = Minutes;

const redoStack: UndoableAction[][] = [];
const undoStack: UndoableAction[][] = [];

@State<MinutesStateModel>({
  name: 'minutes',
  defaults: null
})
@Injectable()
export class MinutesState {
  //

  @Selector() static audioURL(minutes: MinutesStateModel): string {
    return minutes?.audio?.url;
  }

  @Action(ClearStacks) clearStacks({ dispatch }): void {
    redoStack.length = 0;
    undoStack.length = 0;
    dispatch(new CanDo(false, false));
  }

  @Action(JoinTranscriptions) joinTranscriptions(
    { dispatch, getState, setState },
    { ix, iy, undoing }
  ): void {
    // 🔥 for now, must be two adjacent transcriptions
    if (iy !== ix + 1) throw new Error('JoinTransriptions must be adjacent!');
    // 👇 capture the new speech
    const speech1 = getState().transcription[ix].speech;
    const speech2 = getState().transcription[ix + 1].speech;
    // 👇 put the inverse action onto the undo stack
    if (!undoing) {
      redoStack.length = 0;
      while (undoStack.length >= Constants.maxUndoStackSize) undoStack.shift();
      undoStack.push([
        new SplitTranscription(ix, speech1.length, true),
        new JoinTranscriptions(ix, ix + 1, true)
      ]);
      dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    }
    // 👇 now do the action
    setState(
      patch({
        transcription: updateItem(
          ix,
          patch({ speech: `${speech1} ${speech2}` })
        )
      })
    );
    setState(patch({ transcription: removeItem(ix + 1) }));
  }

  @Action(Redo) redo({ dispatch }): void {
    // 👇 quick return if nothing to redo
    if (redoStack.length === 0) return;
    // 👇 execute the redo operation
    const [undoAction, redoAction] = redoStack.pop();
    dispatch(redoAction);
    // 👇 put the undo action onto its stack
    undoStack.push([undoAction, redoAction]);
    dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
  }

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetMinutes) setMinutes({ dispatch, setState }, { minutes }): void {
    if (minutes.audio) setState({ audio: patch(minutes.audio) });
    setState(patch(minutes));
    // 👇 this action clears the undo/redo stacks
    dispatch(new ClearStacks());
  }

  @Action(SplitTranscription) splitTranscription(
    { dispatch, getState, setState },
    { ix, pos, undoing }
  ): void {
    // 👇 capture the original
    const original: Transcription = { ...getState().transcription[ix] };
    // 👇 put the inverse action onto the undo stack
    if (!undoing) {
      redoStack.length = 0;
      while (undoStack.length >= Constants.maxUndoStackSize) undoStack.shift();
      undoStack.push([
        new JoinTranscriptions(ix, ix + 1, true),
        new SplitTranscription(ix, pos, true)
      ]);
      dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    }
    // 👇 now do the action
    setState(
      patch({
        transcription: updateItem(
          ix,
          patch({ speech: original.speech.substring(0, pos).trim() })
        )
      })
    );
    setState(
      patch({
        transcription: insertItem(
          { ...original, speech: original.speech.substring(pos).trim() },
          ix + 1
        )
      })
    );
  }

  @Selector() static transcription(
    minutes: MinutesStateModel
  ): Transcription[] {
    return minutes?.transcription ?? [];
  }

  @Action(Undo) undo({ dispatch }): void {
    // 👇 quick return if nothing to undo
    if (undoStack.length === 0) return;
    // 👇 execute the undo operation
    const [undoAction, redoAction] = undoStack.pop();
    dispatch(undoAction);
    // 👇 put the redo action onto its stack
    redoStack.push([undoAction, redoAction]);
    dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
  }

  @Action(UpdateTranscription) updateTranscription(
    { dispatch, getState, setState },
    { transcription, ix, undoing }
  ): void {
    // 👇 put the inverse action onto the undo stack
    if (!undoing) {
      redoStack.length = 0;
      while (undoStack.length >= Constants.maxUndoStackSize) undoStack.shift();
      undoStack.push([
        new UpdateTranscription(getState().transcription[ix], ix, true),
        new UpdateTranscription(transcription, ix, true)
      ]);
      dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
    }
    // 👇 now do the action
    setState(patch({ transcription: updateItem(ix, patch(transcription)) }));
  }
}
