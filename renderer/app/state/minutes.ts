import { Action } from '@ngxs/store';
import { AgendaItem } from '#mm/common';
import { Constants } from '#mm/common';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { NgxsOnInit } from '@ngxs/store';
import { Selector } from '@ngxs/store';
import { Stack as StackUndoable } from '#mm/state/undo';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { Summary } from '#mm/common';
import { Transcription } from '#mm/common';
import { UndoableAction } from '#mm/state/undo';

import { debounce } from 'rxjs';
import { inject } from '@angular/core';
import { insertItem } from '@ngxs/store/operators';
import { map } from 'rxjs';
import { objectsHaveSameKeys } from '#mm/utils';
import { patch } from '@ngxs/store/operators';
import { removeItem } from '@ngxs/store/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { updateItem } from '@ngxs/store/operators';
import { withPreviousItem } from '#mm/utils';

export class InsertAgendaItem extends UndoableAction {
  static readonly type = '[Minutes] InsertAgendaItem';
  constructor(
    public agendaItem: Partial<AgendaItem>,
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
  constructor(public ix: number, undoing = false) {
    super(undoing);
  }
}

export class RemoveAgendaItem extends UndoableAction {
  static readonly type = '[Minutes] RemoveAgendaItem';
  constructor(public ix: number, undoing = false) {
    super(undoing);
  }
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
export class MinutesState implements NgxsOnInit {
  updateBuffer$ = new Subject<
    UpdateAgendaItem | UpdateSummary | UpdateTranscription
  >();

  #store = inject(Store);

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(MinutesState.audioURL) audioURL$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static audioURL(minutes: MinutesStateModel): string {
    return minutes?.audio?.url;
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 InsertAgendaItem
  // //////////////////////////////////////////////////////////////////////////

  @Action(InsertAgendaItem) insertAgendaItem(
    { getState, setState }: StateContext<MinutesStateModel>,
    { agendaItem, ix, undoing }: InsertAgendaItem
  ): void {
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new RemoveAgendaItem(ix, true),
          new InsertAgendaItem(agendaItem, ix, true)
        ])
      );
    // 👇 now do the action
    const nextTranscriptionID = Number(getState().nextTranscriptionID) + 1;
    setState(
      patch({
        nextTranscriptionID,
        transcription: insertItem(
          { ...agendaItem, id: nextTranscriptionID, type: 'AG' },
          ix
        )
      })
    );
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 InsertTranscription
  // //////////////////////////////////////////////////////////////////////////

  @Action(InsertTranscription) insertTranscription(
    { getState, setState }: StateContext<MinutesStateModel>,
    { transcription, ix, undoing }: InsertTranscription
  ): void {
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new RemoveTranscription(ix, true),
          new InsertTranscription(transcription, ix, true)
        ])
      );
    // 👇 now do the action
    const nextTranscriptionID = Number(getState().nextTranscriptionID) + 1;
    setState(
      patch({
        nextTranscriptionID,
        transcription: insertItem(
          { ...transcription, id: nextTranscriptionID, type: 'TX' },
          ix
        )
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
    const speech1 = this.#pluckTranscription(state, ix).speech;
    const speech2 = this.#pluckTranscription(state, ix + 1).speech;
    const speech = `${speech1} ${speech2}`;
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new SplitTranscription(ix, speech1.length, true),
          new JoinTranscriptions(ix, true)
        ])
      );
    // 👇 now do the action
    setState(
      patch({
        transcription: updateItem(ix, patch({ speech }))
      })
    );
    setState(patch({ transcription: removeItem(ix + 1) }));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 RemoveAgendaItem
  // //////////////////////////////////////////////////////////////////////////

  @Action(RemoveAgendaItem) removeAgendaItem(
    { getState, setState }: StateContext<MinutesStateModel>,
    { ix, undoing }: RemoveAgendaItem
  ): void {
    // 👇 capture the original
    const state = getState();
    const original: AgendaItem = { ...this.#pluckAgendaItem(state, ix) };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new InsertAgendaItem(original, ix, true),
          new RemoveAgendaItem(ix, true)
        ])
      );
    // 👇 now do the action
    setState(patch({ transcription: removeItem(ix) }));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 RemoveTranscription
  // //////////////////////////////////////////////////////////////////////////

  @Action(RemoveTranscription) removeTranscription(
    { getState, setState }: StateContext<MinutesStateModel>,
    { ix, undoing }: RemoveTranscription
  ): void {
    // 👇 capture the original
    const state = getState();
    const original: Transcription = { ...this.#pluckTranscription(state, ix) };
    // 👇 put the inverse action onto the undo stack
    if (!undoing)
      this.#store.dispatch(
        new StackUndoable([
          new InsertTranscription(original, ix, true),
          new RemoveTranscription(ix, true)
        ])
      );
    // 👇 now do the action
    setState(patch({ transcription: removeItem(ix) }));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SetMinutes
  // //////////////////////////////////////////////////////////////////////////

  // 👇 NOTE: utility action, as not all have to be set at once
  @Action(SetMinutes) setMinutes({ setState }, { minutes }: SetMinutes): void {
    if (minutes.audio) setState({ audio: patch(minutes.audio) });
    setState(patch(minutes));
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
    // 👇 now do the action
    setState(
      patch({
        transcription: updateItem(
          ix,
          patch({ speech: original.speech.substring(0, pos).trim() })
        )
      })
    );
    const nextTranscriptionID = Number(getState().nextTranscriptionID) + 1;
    setState(
      patch({
        nextTranscriptionID,
        transcription: insertItem(
          {
            speech: original.speech.substring(pos).trim(),
            id: nextTranscriptionID,
            type: 'TX'
          },
          ix + 1
        )
      })
    );
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(MinutesState.summary) summary$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static summary(minutes: MinutesStateModel): Summary[] {
    return minutes?.summary ?? [];
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟪 @Select(MinutesState.transcription) transcription$
  // //////////////////////////////////////////////////////////////////////////

  @Selector() static transcription(
    minutes: MinutesStateModel
  ): (AgendaItem | Transcription)[] {
    return minutes?.transcription ?? [];
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
  // 🟫 Initialization
  // //////////////////////////////////////////////////////////////////////////

  ngxsOnInit(): void {
    // 👇 all this to make sure that when we switch rows, we don't debounce
    this.updateBuffer$
      .pipe(
        takeUntilDestroyed(),
        withPreviousItem<UpdateAgendaItem | UpdateTranscription>(),
        debounce(({ previous, current }) =>
          !previous ||
          previous.ix !== current.ix ||
          !objectsHaveSameKeys(previous, current)
            ? timer(0)
            : timer(Constants.updateBufferDebounceTime)
        ),
        map(({ current }) => current)
      )
      .subscribe((action) => this.#store.dispatch(action));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟦 helper methods
  // //////////////////////////////////////////////////////////////////////////

  #pluckAgendaItem(state: MinutesStateModel, ix: number): AgendaItem {
    if (state.transcription[ix].type === 'AG')
      return state.transcription[ix] as any as AgendaItem;
    else throw new Error(`Operation not supported for item #${ix}`);
  }

  #pluckTranscription(state: MinutesStateModel, ix: number): Transcription {
    if (state.transcription[ix].type === 'TX')
      return state.transcription[ix] as any as Transcription;
    else throw new Error(`Operation not supported for item #${ix}`);
  }
}
