import { Action } from '@ngxs/store';
import { AgendaItem } from '#mm/common';
import { FindReplace } from '#mm/common';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { Selector } from '@ngxs/store';
import { Stack as StackUndoable } from '#mm/state/undo';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Summary } from '#mm/common';
import { Transcription } from '#mm/common';
import { UndoableAction } from '#mm/state/undo';

import { inject } from '@angular/core';
import { insertItem } from '@ngxs/store/operators';
import { patch } from '@ngxs/store/operators';
import { pluckOriginalFromChanges } from '#mm/utils';
import { removeItem } from '@ngxs/store/operators';
import { updateItem } from '@ngxs/store/operators';

import deepCopy from 'deep-copy';
import deepEqual from 'deep-equal';

export class ClearMinutes {
  static readonly type = '[Minutes] ClearMinutes';
  constructor() {}
}

export class InsertTranscriptionItem extends UndoableAction {
  static readonly type = '[Minutes] InsertTranscriptionItem';
  constructor(
    public item: Partial<AgendaItem | Transcription>,
    public ix: number,
    undoing = false
  ) {
    super(undoing);
  }
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
  constructor(
    public ix: number,
    undoing = false
  ) {
    super(undoing);
  }
}

export class RemoveTranscriptionItem extends UndoableAction {
  static readonly type = '[Minutes] RemoveTranscriptionItem';
  constructor(
    public ix: number,
    undoing = false
  ) {
    super(undoing);
  }
}

export class RemoveTranscription extends UndoableAction {
  static readonly type = '[Minutes] RemoveTranscription';
  constructor(
    public ix: number,
    undoing = false
  ) {
    super(undoing);
  }
}

export class SetMinutes {
  static readonly type = '[Minutes] SetMinutes';
  constructor(public minutes: Partial<Minutes>) {}
}

export class SplitTranscription extends UndoableAction {
  static readonly type = '[Minutes] SplitTranscription';
  constructor(
    public ix: number,
    public pos: number,
    undoing = false
  ) {
    super(undoing);
  }
}

export class UpdateAgendaItem extends UndoableAction {
  static readonly type = '[Minutes] UpdateAgendaItem';
  constructor(
    public agendaItem: Partial<AgendaItem>,
    public ix: number,
    undoing = false
  ) {
    super(undoing);
  }
}

export class UpdateChanges extends UndoableAction {
  static readonly type = '[Minutes] UpdateChanges';
  constructor(
    public details: Partial<Minutes>,
    undoing = false
  ) {
    super(undoing);
  }
}

export class UpdateFindReplace {
  static readonly type = '[Minutes] UpdateFindReplace';
  constructor(public findReplace: Partial<FindReplace>) {}
}

export class UpdateSpeakers extends UndoableAction {
  static readonly type = '[Minutes] UpdateSpeaker';
  constructor(
    public original: string,
    public speaker: string,
    public ix: number,
    undoing = false
  ) {
    super(undoing);
  }
}

export class UpdateSummary extends UndoableAction {
  static readonly type = '[Minutes] UpdateSummary';
  constructor(
    public summary: Partial<Summary>,
    public ix: number,
    undoing = false
  ) {
    super(undoing);
  }
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

@State<MinutesStateModel>({
  name: 'minutes',
  defaults: null
})
@Injectable()
export class MinutesState {
  #store = inject(Store);

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 ClearMinutes
  // //////////////////////////////////////////////////////////////////////////

  @Action(ClearMinutes) clearMinutes({ setState }): void {
    setState(null);
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 InsertTranscriptionItem
  // //////////////////////////////////////////////////////////////////////////

  @Action(InsertTranscriptionItem) insertAgendaItem(
    { getState, setState }: StateContext<MinutesStateModel>,
    { item, ix, undoing }: InsertTranscriptionItem
  ): void {
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new RemoveTranscriptionItem(ix, true),
          new InsertTranscriptionItem(item, ix, true)
        ])
      );
    // 👇 now do the action
    const nextTranscriptionID = getState().nextTranscriptionID + 1;
    setState(
      patch({
        nextTranscriptionID,
        transcription: insertItem({ ...item, id: nextTranscriptionID }, ix)
      })
    );
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 JoinTranscriptions
  // 🔥 for now, must be two adjacent transcriptions
  // //////////////////////////////////////////////////////////////////////////

  @Action(JoinTranscriptions) joinTranscriptions(
    { getState, setState }: StateContext<MinutesStateModel>,
    { ix, undoing }: JoinTranscriptions
  ): void {
    // 👇 capture the new speech
    const state = getState();
    const tx1 = this.#pluckTranscription(state, ix);
    const tx2 = this.#pluckTranscription(state, ix + 1);
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new SplitTranscription(ix, tx1.speech.length, true),
          new JoinTranscriptions(ix, true)
        ])
      );
    // 👇 now do the action
    setState(
      patch({
        transcription: updateItem(
          ix,
          patch({ end: tx2.end, speech: `${tx1.speech} ${tx2.speech}` })
        )
      })
    );
    setState(patch({ transcription: removeItem(ix + 1) }));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 RemoveTranscriptionItem
  // //////////////////////////////////////////////////////////////////////////

  @Action(RemoveTranscriptionItem) removeTranscriptionItem(
    { getState, setState }: StateContext<MinutesStateModel>,
    { ix, undoing }: RemoveTranscriptionItem
  ): void {
    // 👇 capture the original
    const state = getState();
    const original: AgendaItem | Transcription = { ...state.transcription[ix] };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new InsertTranscriptionItem(original, ix, true),
          new RemoveTranscriptionItem(ix, true)
        ])
      );
    // 👇 now do the action
    setState(patch({ transcription: removeItem(ix) }));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SetMinutes
  // //////////////////////////////////////////////////////////////////////////

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetMinutes) setMinutes(
    { getState, patchState, setState },
    { minutes }: SetMinutes
  ): void {
    const state = getState();
    if (!state) setState(minutes);
    else {
      const { audio, findReplace, ...rest } = minutes;
      if (audio) patchState({ audio: { ...state.audio, ...audio } });
      if (findReplace)
        patchState({ findReplace: { ...state.findReplace, ...findReplace } });
      setState(patch(rest));
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SplitTranscription
  // //////////////////////////////////////////////////////////////////////////

  @Action(SplitTranscription) splitTranscription(
    { getState, setState }: StateContext<MinutesStateModel>,
    { ix, pos, undoing }: SplitTranscription
  ): void {
    // 👇 capture the original
    const state = getState();
    const original: Transcription = { ...this.#pluckTranscription(state, ix) };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new JoinTranscriptions(ix, true),
          new SplitTranscription(ix, pos, true)
        ])
      );
    // 👇 approximate the new end/start times from words per second
    const speech = original.speech.trim();
    const speech1 = speech.substring(0, pos).trim();
    const speech2 = speech.substring(pos).trim();
    const wps = (original.end - original.start) / speech.split(/\s+/).length;
    // ❗ can't go backwards
    const splitTime = Math.max(
      original.start,
      speech1.split(/\s+/).length * wps
    );
    // 👇 now do the action
    setState(
      patch({
        transcription: updateItem(
          ix,
          patch({ end: splitTime, speech: speech1 })
        )
      })
    );
    const nextTranscriptionID = getState().nextTranscriptionID + 1;
    setState(
      patch({
        nextTranscriptionID,
        transcription: insertItem(
          {
            end: original.end,
            id: nextTranscriptionID,
            speaker: '???',
            speech: speech2,
            start: splitTime,
            type: 'TX'
          },
          ix + 1
        )
      })
    );
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(MinutesState.transcriptionName) transcriptionName$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static transcriptionName(minutes: MinutesStateModel): string {
    return minutes?.transcriptionName;
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 UpdateAgendaItem
  // //////////////////////////////////////////////////////////////////////////

  @Action(UpdateAgendaItem) updateAgendaItem(
    { getState, setState }: StateContext<MinutesStateModel>,
    { agendaItem, ix, undoing }: UpdateAgendaItem
  ): void {
    // 👇 capture the original
    const state = getState();
    const original: AgendaItem = { ...this.#pluckAgendaItem(state, ix) };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new UpdateAgendaItem(original, ix, true),
          new UpdateAgendaItem(agendaItem, ix, true)
        ])
      );
    // 👇 now do the action
    setState(patch({ transcription: updateItem(ix, patch(agendaItem)) }));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 UpdateChanges
  //    the big difference between this and SetMinutes is that it is undoable
  // //////////////////////////////////////////////////////////////////////////

  @Action(UpdateChanges) updateChanges(
    { getState, setState },
    { details, undoing }: UpdateChanges
  ): void {
    // 👇 capture the original
    const state = deepCopy(getState());
    const changes = deepCopy(details);
    const original: Partial<Minutes> = {
      ...pluckOriginalFromChanges(state, changes)
    };
    // 👇 only if there's a delta
    if (!deepEqual(original, changes)) {
      // 👇 put the inverse action onto the undo stack
      if (!undoing)
        this.#store.dispatch(
          new StackUndoable([
            new UpdateChanges(original, true),
            new UpdateChanges(changes, true)
          ])
        );
      // 👇 now do the action
      setState(patch(changes));
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 UpdateFindReplace
  // //////////////////////////////////////////////////////////////////////////

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(UpdateFindReplace) updateFindReplace(
    { getState, setState },
    { findReplace }: UpdateFindReplace
  ): void {
    if (getState().findReplace)
      setState(patch({ findReplace: patch(findReplace) }));
    else setState(patch({ findReplace }));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 UpdateSpeakers
  // //////////////////////////////////////////////////////////////////////////

  @Action(UpdateSpeakers) updateSpeakers(
    { getState, setState }: StateContext<MinutesStateModel>,
    { original, speaker, ix, undoing }: UpdateSpeakers
  ): void {
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new UpdateSpeakers(speaker, original, ix, true),
          new UpdateSpeakers(original, speaker, ix, true)
        ])
      );
    // 👇 now do the action
    for (let iy = ix; iy < getState().transcription.length - 1; iy++) {
      const tx = getState().transcription[iy];
      if (tx.type === 'TX' && tx.speaker === original)
        setState(patch({ transcription: updateItem(iy, patch({ speaker })) }));
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 UpdateSummary
  // //////////////////////////////////////////////////////////////////////////

  @Action(UpdateSummary) updateSummary(
    { getState, setState }: StateContext<MinutesStateModel>,
    { summary, ix, undoing }: UpdateSummary
  ): void {
    // 👇 capture the original
    const state = getState();
    const original: Summary = { ...state.summary[ix] };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new UpdateSummary(original, ix, true),
          new UpdateSummary(summary, ix, true)
        ])
      );
    // 👇 now do the action
    setState(patch({ summary: updateItem(ix, patch(summary)) }));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 UpdateTranscription
  // //////////////////////////////////////////////////////////////////////////

  @Action(UpdateTranscription) updateTranscription(
    { getState, setState }: StateContext<MinutesStateModel>,
    { transcription, ix, undoing }: UpdateTranscription
  ): void {
    // 👇 capture the original
    const state = getState();
    const original: Transcription = { ...this.#pluckTranscription(state, ix) };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new UpdateTranscription(original, ix, true),
          new UpdateTranscription(transcription, ix, true)
        ])
      );
    // 👇 now do the action
    setState(patch({ transcription: updateItem(ix, patch(transcription)) }));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟦 helper methods
  // //////////////////////////////////////////////////////////////////////////

  #pluckAgendaItem(state: MinutesStateModel, ix: number): AgendaItem {
    if (state.transcription[ix].type === 'AG')
      return state.transcription[ix] as any as AgendaItem;
    else throw new Error(`🔥 Operation not supported for item #${ix}`);
  }

  #pluckTranscription(state: MinutesStateModel, ix: number): Transcription {
    if (state.transcription[ix].type === 'TX')
      return state.transcription[ix] as any as Transcription;
    else throw new Error(`🔥 Operation not supported for item #${ix}`);
  }
}
