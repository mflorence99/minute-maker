import { Channels } from '#mm/common';
import { CloseMinutes } from '#mm/state/app';
import { ExportMinutes } from '#mm/state/app';
import { Injectable } from '@angular/core';
import { InsertableDirective } from '#mm/directives/insertable';
import { InsertAgendaItem } from '#mm/state/minutes';
import { JoinableDirective } from '#mm/directives/joinable';
import { JoinTranscriptions } from '#mm/state/minutes';
import { MenuID } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { NewMinutes } from '#mm/state/app';
import { Observable } from 'rxjs';
import { OpenMinutes } from '#mm/state/app';
import { RecentsState } from '#mm/state/recents';
import { RecentsStateModel } from '#mm/state/recents';
import { Redo } from '#mm/state/undo';
import { RemovableDirective } from '#mm/directives/removable';
import { RemoveAgendaItem } from '#mm/state/minutes';
import { RephraseableDirective } from '#mm/directives/rephraseable';
import { RephraseTranscription } from '#mm/state/app';
import { SaveMinutes } from '#mm/state/app';
import { Select } from '@ngxs/store';
import { SplittableDirective } from '#mm/directives/splittable';
import { SplitTranscription } from '#mm/state/minutes';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { SubmenuItem } from '#mm/common';
import { Undo } from '#mm/state/undo';
import { UndoState } from '#mm/state/undo';
import { UndoStateModel } from '#mm/state/undo';
import { WINDOW } from '@ng-web-apis/common';

import { inject } from '@angular/core';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

// 👇 this service is not used by any component; instead it is a
//    dispatcher for menu tasks and is injected into the root module

@Injectable({ providedIn: 'root' })
export class MenuService {
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;
  @Select(RecentsState) recents$: Observable<RecentsStateModel>;
  @Select(StatusState) status$: Observable<StatusStateModel>;
  @Select(UndoState) undo$: Observable<UndoStateModel>;

  #store = inject(Store);
  #window = inject(WINDOW);

  constructor() {
    this.#dispatch();
    this.#monitorElementState();
    this.#monitorMinutesState();
    this.#monitorRecentsState();
    this.#monitorStatusState();
    this.#monitorUndoState();
  }

  #dispatch(): void {
    ipc.on(
      Channels.menuSelected,
      (event, id: MenuID, data: string, x: number, y: number) => {
        switch (id) {
          case MenuID.close:
            this.#store.dispatch(new CloseMinutes());
            break;
          case MenuID.export:
            this.#store.dispatch(new ExportMinutes());
            break;
          case MenuID.insert:
            {
              const ix = this.#getInsertableIndex(this.#elementFromPoint(x, y));
              if (!isNaN(ix))
                this.#store.dispatch(
                  new InsertAgendaItem({ title: 'New Agenda Item' }, ix)
                );
            }
            break;
          case MenuID.join:
            {
              const ix = this.#getJoinableIndex(this.#elementFromPoint(x, y));
              if (!isNaN(ix)) this.#store.dispatch(new JoinTranscriptions(ix));
            }
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
          case MenuID.recents:
            this.#store.dispatch(new OpenMinutes(data));
            break;
          case MenuID.remove:
            {
              const ix = this.#getRemovableIndex(this.#elementFromPoint(x, y));
              if (!isNaN(ix)) this.#store.dispatch(new RemoveAgendaItem(ix));
            }
            break;
          case MenuID.rephraseAccuracy:
            {
              const ix = this.#getRephraseableIndex(
                this.#elementFromPoint(x, y)
              );
              if (!isNaN(ix))
                this.#store.dispatch(new RephraseTranscription('accuracy', ix));
            }
            break;
          case MenuID.rephraseBrevity:
            {
              const ix = this.#getRephraseableIndex(
                this.#elementFromPoint(x, y)
              );
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
          case MenuID.split:
            {
              const element = this.#elementFromPoint(x, y);
              const ix = this.#getSplittableIndex(element);
              if (!isNaN(ix)) {
                const iy = element.selectionStart;
                this.#store.dispatch(new SplitTranscription(ix, iy));
              }
            }
            break;
          case MenuID.undo:
            this.#store.dispatch(new Undo());
            break;
        }
      }
    );
  }

  #elementFromPoint(x: number, y: number): HTMLTextAreaElement {
    return x && y
      ? (this.#window.document.elementFromPoint(x, y) as HTMLTextAreaElement)
      : null;
  }

  #getInsertableIndex(element: HTMLElement): number {
    const insertable = element?.['mmInsertable'] as InsertableDirective;
    return Number(insertable?.mmInsertable ?? NaN);
  }

  #getJoinableIndex(element: HTMLElement): number {
    const joinable = element?.['mmJoinable'] as JoinableDirective;
    return Number(joinable?.mmJoinable ?? NaN);
  }

  #getRemovableIndex(element: HTMLElement): number {
    const removable = element?.['mmRemovable'] as RemovableDirective;
    return Number(removable?.mmRemovable ?? NaN);
  }

  #getRephraseableIndex(element: HTMLElement): number {
    const rephraseable = element?.['mmRephraseable'] as RephraseableDirective;
    return Number(rephraseable?.mmRephraseable ?? NaN);
  }

  #getSplittableIndex(element: HTMLElement): number {
    const splittable = element?.['mmSplittable'] as SplittableDirective;
    return Number(splittable?.mmSplittable ?? NaN);
  }

  #monitorElementState(): void {
    this.#window.addEventListener('pointerdown', (event: MouseEvent) => {
      const element = event.target as HTMLElement;
      const status = this.#store.selectSnapshot(StatusState);
      ipc.send(Channels.menuEnable, {
        [MenuID.insert]: !isNaN(this.#getInsertableIndex(element)),
        [MenuID.join]: !isNaN(this.#getJoinableIndex(element)),
        [MenuID.remove]: !isNaN(this.#getRemovableIndex(element)),
        [MenuID.rephraseAccuracy]:
          !isNaN(this.#getRephraseableIndex(element)) &&
          status.working !== 'rephrase',
        [MenuID.rephraseBrevity]:
          !isNaN(this.#getRephraseableIndex(element)) &&
          status.working !== 'rephrase',
        [MenuID.split]: !isNaN(this.#getSplittableIndex(element))
      });
    });
  }

  #monitorMinutesState(): void {
    this.minutes$.subscribe((state) => {
      ipc.send(Channels.menuEnable, {
        [MenuID.close]: !!state,
        [MenuID.export]: !!state?.transcription && !!state?.summary,
        [MenuID.save]: !!state,
        [MenuID.saveAs]: !!state
      });
    });
  }

  #monitorRecentsState(): void {
    this.recents$.subscribe((paths) => {
      ipc.send(Channels.menuEnable, {
        [MenuID.recents]:
          paths.length < 2
            ? false
            : // 👇 in this case, we build a submenu of recent items
              paths.map(
                (path): SubmenuItem => ({
                  data: path,
                  id: MenuID.recents,
                  label: path
                })
              )
      });
    });
  }

  #monitorStatusState(): void {
    this.status$.subscribe((status) => {
      ipc.send(Channels.menuEnable, {
        [MenuID.rephraseAccuracy]: status.working !== 'rephrase',
        [MenuID.rephraseBrevity]: status.working !== 'rephrase'
      });
    });
  }

  #monitorUndoState(): void {
    this.undo$.subscribe((undo) => {
      ipc.send(Channels.menuEnable, {
        [MenuID.redo]: undo.redoStack.length > 0,
        [MenuID.undo]: undo.undoStack.length > 0
      });
    });
  }
}
