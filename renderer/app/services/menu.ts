import { Channels } from '#mm/common';
import { CloseMinutes } from '#mm/state/app';
import { ExportMinutes } from '#mm/state/app';
import { Injectable } from '@angular/core';
import { MenuID } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { NewMinutes } from '#mm/state/app';
import { Observable } from 'rxjs';
import { OpenMinutes } from '#mm/state/app';
import { Redo } from '#mm/state/undo';
import { RephraseableDirective } from '#mm/directives/rephraseable';
import { RephraseTranscription } from '#mm/state/app';
import { SaveMinutes } from '#mm/state/app';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Undo } from '#mm/state/undo';
import { UndoState } from '#mm/state/undo';
import { UndoStateModel } from '#mm/state/undo';
import { WINDOW } from '@ng-web-apis/common';

import { inject } from '@angular/core';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class MenuService {
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;
  @Select(UndoState) undo$: Observable<UndoStateModel>;

  #store = inject(Store);
  #window = inject(WINDOW);

  constructor() {
    this.#dispatch();
    this.#monitorElementState();
    this.#monitorMinutesState();
    this.#monitorUndoState();
  }

  #dispatch(): void {
    ipc.on(Channels.menuSelected, (event, id: MenuID, x: number, y: number) => {
      switch (id) {
        case MenuID.close:
          this.#store.dispatch(new CloseMinutes());
          break;
        case MenuID.export:
          this.#store.dispatch(new ExportMinutes());
          break;
        case MenuID.new:
          this.#store.dispatch(new NewMinutes());
          break;
        case MenuID.open:
          this.#store.dispatch(new OpenMinutes());
          break;
        case MenuID.redo:
          this.#store.dispatch(new Redo());
          break;
        case MenuID.rephraseAccuracy:
          {
            const ix = this.#getRephraseableIndex(this.#elementFromPoint(x, y));
            if (!isNaN(ix))
              this.#store.dispatch(new RephraseTranscription('accuracy', ix));
          }
          break;
        case MenuID.rephraseBrevity:
          {
            const ix = this.#getRephraseableIndex(this.#elementFromPoint(x, y));
            if (!isNaN(ix))
              this.#store.dispatch(new RephraseTranscription('brevity', ix));
          }
          break;
        case MenuID.save:
          this.#store.dispatch(new SaveMinutes());
          break;
        case MenuID.saveAs:
          this.#store.dispatch(new SaveMinutes(true));
          break;
        case MenuID.undo:
          this.#store.dispatch(new Undo());
          break;
      }
    });
  }

  #elementFromPoint(x: number, y: number): HTMLElement {
    return x && y
      ? (this.#window.document.elementFromPoint(x, y) as HTMLElement)
      : null;
  }

  #getRephraseableIndex(element: HTMLElement): number {
    const rephraseable = element?.['mmRephraseable'] as RephraseableDirective;
    return Number(rephraseable?.mmRephraseable ?? NaN);
  }

  #monitorElementState(): void {
    this.#window.addEventListener('pointerdown', (event: MouseEvent) => {
      const element = event.target as HTMLElement;
      ipc.send(Channels.menuEnable, {
        [MenuID.rephraseAccuracy]: !isNaN(this.#getRephraseableIndex(element)),
        [MenuID.rephraseBrevity]: !isNaN(this.#getRephraseableIndex(element))
      });
    });
  }

  #monitorMinutesState(): void {
    this.minutes$.subscribe((state) => {
      ipc.send(Channels.menuEnable, {
        [MenuID.close]: !!state,
        [MenuID.export]: state?.transcription && state?.summary,
        [MenuID.save]: !!state,
        [MenuID.saveAs]: !!state
      });
    });
  }

  #monitorUndoState(): void {
    this.undo$.subscribe((state) => {
      ipc.send(Channels.menuEnable, {
        [MenuID.redo]: state.redoStack.length > 0,
        [MenuID.undo]: state.undoStack.length > 0
      });
    });
  }
}
