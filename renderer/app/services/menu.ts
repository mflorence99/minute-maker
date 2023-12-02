import { Channels } from '#mm/common';
import { ComponentState } from '#mm/state/component';
import { ComponentStateModel } from '#mm/state/component';
import { ControllerService } from '#mm/services/controller';
import { Injectable } from '@angular/core';
import { InsertableDirective } from '#mm/directives/insertable';
import { InsertTranscriptionItem } from '#mm/state/minutes';
import { JoinableDirective } from '#mm/directives/joinable';
import { JoinTranscriptions } from '#mm/state/minutes';
import { MenuID } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { Observable } from 'rxjs';
import { RecentsState } from '#mm/state/recents';
import { RecentsStateModel } from '#mm/state/recents';
import { Redo } from '#mm/state/undo';
import { RemovableDirective } from '#mm/directives/removable';
import { RemoveTranscriptionItem } from '#mm/state/minutes';
import { RephraseableDirective } from '#mm/directives/rephraseable';
import { Select } from '@ngxs/store';
import { SplittableDirective } from '#mm/directives/splittable';
import { SplitTranscription } from '#mm/state/minutes';
import { StatusState } from '#mm/state/status';
import { StatusStateModel } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { SubmenuItem } from '#mm/common';
import { TabIndex } from '#mm/state/component';
import { Undo } from '#mm/state/undo';
import { UndoState } from '#mm/state/undo';
import { UndoStateModel } from '#mm/state/undo';
import { UpdateFindReplace } from '#mm/state/minutes';
import { WINDOW } from '@ng-web-apis/common';

import { combineLatest } from 'rxjs';
import { inject } from '@angular/core';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

// 👇 this service is not used by any component; instead it is a
//    dispatcher for menu tasks and is injected into the root module

@Injectable({ providedIn: 'root' })
export class MenuService {
  @Select(ComponentState) component$: Observable<ComponentStateModel>;
  @Select(MinutesState) minutes$: Observable<MinutesStateModel>;
  @Select(RecentsState) recents$: Observable<RecentsStateModel>;
  @Select(StatusState) status$: Observable<StatusStateModel>;
  @Select(UndoState) undo$: Observable<UndoStateModel>;

  #controller = inject(ControllerService);
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
          case MenuID.badges:
            this.#controller.generateBadges();
            break;
          case MenuID.close:
            this.#controller.closeMinutes();
            break;
          case MenuID.export:
            this.#controller.exportMinutes();
            break;
          case MenuID.find:
            this.#store.dispatch(new UpdateFindReplace({ doFind: true }));
            break;
          case MenuID.insert:
            {
              const ix = this.#getInsertableIndex(this.#elementFromPoint(x, y));
              if (!isNaN(ix))
                this.#store.dispatch(
                  new InsertTranscriptionItem(
                    { title: 'New Agenda Item', type: 'AG' },
                    ix
                  )
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
            this.#controller.newMinutes();
            break;
          case MenuID.open:
            this.#controller.openMinutes();
            break;
          case MenuID.redo:
            this.#store.dispatch(new Redo());
            break;
          case MenuID.recents:
            this.#controller.openMinutes(data);
            break;
          case MenuID.remove:
            {
              const ix = this.#getRemovableIndex(this.#elementFromPoint(x, y));
              if (!isNaN(ix))
                this.#store.dispatch(new RemoveTranscriptionItem(ix));
            }
            break;
          case MenuID.rephraseAccuracy:
            {
              const ix = this.#getRephraseableIndex(
                this.#elementFromPoint(x, y)
              );
              if (!isNaN(ix))
                this.#controller.rephraseTranscription('accuracy', ix);
            }
            break;
          case MenuID.rephraseBrevity:
            {
              const ix = this.#getRephraseableIndex(
                this.#elementFromPoint(x, y)
              );
              if (!isNaN(ix))
                this.#controller.rephraseTranscription('brevity', ix);
            }
            break;
          case MenuID.replace:
            this.#store.dispatch(
              new UpdateFindReplace({ doFind: true, withReplace: true })
            );
            break;
          case MenuID.save:
            this.#controller.saveMinutes();
            break;
          case MenuID.saveAs:
            this.#controller.saveMinutes(true);
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
          case MenuID.summarizeBullets:
            this.#controller.summarizeMinutes('bullets');
            break;
          case MenuID.summarizeParagraphs:
            this.#controller.summarizeMinutes('paragraphs');
            break;
          case MenuID.transcribe:
            this.#controller.transcribeAudio();
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
      const status = this.#store.selectSnapshot<StatusStateModel>(StatusState);
      ipc.send(Channels.menuEnable, {
        [MenuID.insert]: !isNaN(this.#getInsertableIndex(element)),
        [MenuID.join]: !isNaN(this.#getJoinableIndex(element)),
        [MenuID.remove]: !isNaN(this.#getRemovableIndex(element)),
        [MenuID.rephraseAccuracy]:
          !isNaN(this.#getRephraseableIndex(element)) &&
          status.working?.on !== 'rephrase',
        [MenuID.rephraseBrevity]:
          !isNaN(this.#getRephraseableIndex(element)) &&
          status.working?.on !== 'rephrase',
        [MenuID.split]: !isNaN(this.#getSplittableIndex(element))
      });
    });
  }

  #monitorMinutesState(): void {
    combineLatest({
      componentState: this.component$,
      minutes: this.minutes$
    }).subscribe(({ componentState, minutes }) => {
      ipc.send(Channels.menuEnable, {
        [MenuID.close]: !!minutes,
        [MenuID.export]: !!minutes?.transcription && !!minutes?.summary,
        [MenuID.find]:
          componentState.tabIndex === TabIndex.transcription && !!minutes,
        [MenuID.replace]:
          componentState.tabIndex === TabIndex.transcription && !!minutes,
        [MenuID.save]: !!minutes,
        [MenuID.saveAs]: !!minutes,
        [MenuID.summarizeBullets]: !!minutes?.transcription.length,
        [MenuID.summarizeParagraphs]: !!minutes?.transcription.length,
        [MenuID.transcribe]: !!minutes
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
        [MenuID.rephraseAccuracy]: status.working?.on !== 'rephrase',
        [MenuID.rephraseBrevity]: status.working?.on !== 'rephrase',
        [MenuID.transcribe]: status.working?.on !== 'transcription'
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
