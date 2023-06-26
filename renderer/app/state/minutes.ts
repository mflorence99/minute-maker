import { Action } from '@ngxs/store';
import { Constants } from '#mm/common';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { Selector } from '@ngxs/store';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Transcription } from '#mm/common';

import { inject } from '@angular/core';
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

export class InsertTranscription extends UndoableAction {
  static readonly type = '[Minutes] InsertTranscription';
  constructor(
    public transcription: Partial<Transcription>,
    public ix: number,
    undoing = false
  ) {
    super(undoing);
  }
}

export class JoinTranscriptions extends UndoableAction {
  static readonly type = '[Minutes] JoinTranscriptions';
  constructor(public ix: number, undoing = false) {
    super(undoing);
  }
}

export class Redo {
  static readonly type = '[Minutes] Redo';
  constructor() {}
}

export class RemoveTranscription extends UndoableAction {
  static readonly type = '[Minutes] RemoveTranscription';
  constructor(public ix: number, undoing = false) {
    super(undoing);
  }
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
  #store = inject(Store);

  @Selector() static audioURL(minutes: MinutesStateModel): string {
    return minutes?.audio?.url;
  }

  @Action(ClearStacks) clearStacks(): void {
    redoStack.length = 0;
    undoStack.length = 0;
    this.#store.dispatch(new CanDo(false, false));
  }

  @Action(InsertTranscription) insertTranscription(
    { setState }: StateContext<MinutesStateModel>,
    { transcription, ix, undoing }: InsertTranscription
  ): void {
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#stackUndoActions([
        new RemoveTranscription(ix, true),
        new InsertTranscription(transcription, ix, true)
      ]);
    // 👇 now do the action
    setState(
      patch({
        transcription: insertItem(transcription, ix)
      })
    );
  }

  // 🔥 for now, must be two adjacent transcriptions
  @Action(JoinTranscriptions) joinTranscriptions(
    { getState, setState }: StateContext<MinutesStateModel>,
    { ix, undoing }: JoinTranscriptions
  ): void {
    // 👇 capture the new speech
    const speech1 = getState().transcription[ix].speech;
    const speech2 = getState().transcription[ix + 1].speech;
    const speech = `${speech1} ${speech2}`;
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#stackUndoActions([
        new SplitTranscription(ix, speech1.length, true),
        new JoinTranscriptions(ix, true)
      ]);
    // 👇 now do the action
    setState(
      patch({
        transcription: updateItem(ix, patch({ speech }))
      })
    );
    setState(patch({ transcription: removeItem(ix + 1) }));
  }

  @Action(Redo) redo(): void {
    // 👇 quick return if nothing to redo
    if (redoStack.length === 0) return;
    // 👇 execute the redo operation
    const [undoAction, redoAction] = redoStack.pop();
    this.#store.dispatch(redoAction);
    // 👇 put the undo action onto its stack
    undoStack.push([undoAction, redoAction]);
    this.#store.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
  }

  @Action(RemoveTranscription) removeTranscription(
    { getState, setState }: StateContext<MinutesStateModel>,
    { ix, undoing }: RemoveTranscription
  ): void {
    // 👇 capture the original
    const original: Transcription = { ...getState().transcription[ix] };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#stackUndoActions([
        new InsertTranscription(original, ix, true),
        new RemoveTranscription(ix, true)
      ]);
    // 👇 now do the action
    setState(patch({ transcription: removeItem(ix) }));
  }

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetMinutes) setMinutes({ setState }, { minutes }: SetMinutes): void {
    if (minutes.audio) setState({ audio: patch(minutes.audio) });
    setState(patch(minutes));
    // 👇 this action clears the undo/redo stacks
    this.#store.dispatch(new ClearStacks());
  }

  @Action(SplitTranscription) splitTranscription(
    { getState, setState }: StateContext<MinutesStateModel>,
    { ix, pos, undoing }: SplitTranscription
  ): void {
    // 👇 capture the original
    const original: Transcription = { ...getState().transcription[ix] };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#stackUndoActions([
        new JoinTranscriptions(ix, true),
        new SplitTranscription(ix, pos, true)
      ]);
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
          { speech: original.speech.substring(pos).trim() },
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

  @Action(Undo) undo(): void {
    // 👇 quick return if nothing to undo
    if (undoStack.length === 0) return;
    // 👇 execute the undo operation
    const [undoAction, redoAction] = undoStack.pop();
    this.#store.dispatch(undoAction);
    // 👇 put the redo action onto its stack
    redoStack.push([undoAction, redoAction]);
    this.#store.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
  }

  @Action(UpdateTranscription) updateTranscription(
    { getState, setState }: StateContext<MinutesStateModel>,
    { transcription, ix, undoing }: UpdateTranscription
  ): void {
    // 👇 capture the original
    const original: Transcription = { ...getState().transcription[ix] };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#stackUndoActions([
        new UpdateTranscription(original, ix, true),
        new UpdateTranscription(transcription, ix, true)
      ]);
    // 👇 now do the action
    setState(patch({ transcription: updateItem(ix, patch(transcription)) }));
  }

  #stackUndoActions(actions: UndoableAction[]): void {
    redoStack.length = 0;
    while (undoStack.length >= Constants.maxUndoStackSize) undoStack.shift();
    undoStack.push(actions);
    this.#store.dispatch(new CanDo(undoStack.length > 0, redoStack.length > 0));
  }
}
