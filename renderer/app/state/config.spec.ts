import 'jest-extended';

import { ConfigState } from '#mm/state/config';
import { NgxsModule } from '@ngxs/store';
import { SetConfig } from '#mm/state/config';
import { Store } from '@ngxs/store';
import { TestBed } from '@angular/core/testing';
import { UploaderService } from '#mm/services/uploader';

let configState: ConfigState;
let store: Store;

const defaultState = {
  bucketName: 'xxx'
};

const mockUploader = {
  enableCORS: jest.fn()
};

describe('ConfigState', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([ConfigState])],
      providers: [{ provide: UploaderService, useValue: mockUploader }]
    });
    configState = TestBed.inject(ConfigState);
    store = TestBed.inject(Store);
    // 👇 set the store to its default state
    store.reset({ ...store.snapshot(), config: defaultState });
  });

  it('can select the bucketName', () => {
    const bucketName = store.selectSnapshot(ConfigState.bucketName);
    expect(bucketName).toBe('xxx');
  });

  it('responds to SetConfig', () => {
    store.dispatch(new SetConfig({ bucketName: 'yyy' }));
    const state = store.selectSnapshot(ConfigState);
    expect(state.bucketName).toBe('yyy');
  });

  it('runs initialization code as expected', (done) => {
    configState.ngxsOnInit(); // 👈 need this to set state from ConfigState
    setTimeout(() => {
      expect(mockUploader.enableCORS).toHaveBeenCalledWith('xxx');
      done();
    }, 100);
  });
});
