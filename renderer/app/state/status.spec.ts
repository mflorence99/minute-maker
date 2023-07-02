import 'jest-extended';

import { ClearStatus } from '#mm/state/status';
import { NgxsModule } from '@ngxs/store';
import { SetStatus } from '#mm/state/status';
import { StatusState } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { TestBed } from '@angular/core/testing';

let store: Store;

const defaultState = {
  error: { message: 'xxx' },
  status: 'yyy',
  working: true
};

describe('StatusState', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([StatusState])]
    });
    store = TestBed.inject(Store);
    // 👇 set the store to its default state
    store.reset({ ...store.snapshot(), status: defaultState });
  });

  it('responds to ClearStatus', () => {
    let state = store.selectSnapshot(StatusState);
    expect(state.error.message).toBe('xxx');
    store.dispatch(new ClearStatus());
    state = store.selectSnapshot(StatusState);
    expect(state.error).toBeNull();
  });

  it('responds to SetStatus', () => {
    let state = store.selectSnapshot(StatusState);
    expect(state.working).toBeTrue();
    store.dispatch(new SetStatus({ working: false }));
    state = store.selectSnapshot(StatusState);
    expect(state.working).toBeFalse();
  });
});
