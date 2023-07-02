import 'jest-extended';

import { AddRecent } from '#mm/state/recents';
import { ClearRecents } from '#mm/state/recents';
import { Constants } from '#mm/common';
import { Minutes } from '#mm/common';
import { NgxsModule } from '@ngxs/store';
import { Observable } from 'rxjs';
import { RecentsState } from '#mm/state/recents';
import { Store } from '@ngxs/store';
import { TestBed } from '@angular/core/testing';

import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs';

let store: Store;

const defaultState = ['xxx', 'yyy', 'zzz'];

Object.defineProperty(window, 'ipc', {
  value: {
    // 👇 we only expect to invoke Channels.fsLoadFile
    invoke: jest.fn(() => Promise.resolve('{}'))
  }
});

describe('StatusState', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([RecentsState])]
    });
    store = TestBed.inject(Store);
    // 👇 set the store to its default state
    store.reset({ ...store.snapshot(), recents: defaultState });
  });

  it('responds to ClearRecents', () => {
    let state = store.selectSnapshot(RecentsState);
    expect(state).toStrictEqual(['xxx', 'yyy', 'zzz']);
    store.dispatch(new ClearRecents());
    state = store.selectSnapshot(RecentsState);
    expect(state).toStrictEqual([]);
  });

  it('adds a new path to the top of the list', () => {
    store.dispatch(new AddRecent('aaa'));
    const state = store.selectSnapshot(RecentsState);
    expect(state).toStrictEqual(['aaa', 'xxx', 'yyy', 'zzz']);
  });

  it('bumps an existing path to the top of the list', () => {
    store.dispatch(new AddRecent('zzz'));
    const state = store.selectSnapshot(RecentsState);
    expect(state).toStrictEqual(['zzz', 'xxx', 'yyy']);
  });

  it('trims the list of paths if more than the  maximum are added', () => {
    Constants.maxRecentPaths = 7; // 👈 jam as known quantity
    store.dispatch(new AddRecent('aaa'));
    store.dispatch(new AddRecent('bbb'));
    store.dispatch(new AddRecent('ccc'));
    store.dispatch(new AddRecent('ddd'));
    store.dispatch(new AddRecent('eee'));
    const state = store.selectSnapshot(RecentsState);
    expect(state).toStrictEqual([
      'eee',
      'ddd',
      'ccc',
      'bbb',
      'aaa',
      'xxx',
      'yyy'
    ]);
  });

  it('can select a recents$ Observable', (done) => {
    const recents$ = store.select(RecentsState.minutes);
    recents$
      .pipe(switchMap((minutes$: Observable<Minutes>[]) => forkJoin(minutes$)))
      .subscribe((recents) => {
        expect(recents).toStrictEqual([{}, {}]);
        done();
      });
  });
});
