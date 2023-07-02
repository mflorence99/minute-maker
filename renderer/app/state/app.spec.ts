import 'jest-extended';

import { AppState } from '#mm/state/app';
import { CancelTranscription } from '#mm/state/app';
import { FSService } from '#mm/services/fs';
import { MetadataService } from '#mm/services/metadata';
import { NewMinutes } from '#mm/state/app';
import { NgxsModule } from '@ngxs/store';
import { OpenMinutes } from '#mm/state/app';
import { Store } from '@ngxs/store';
import { TestBed } from '@angular/core/testing';
import { TranscriberService } from '#mm/services/transcriber';
import { UploaderService } from '#mm/services/uploader';

let appState: AppState;
let store: Store;

const defaultState = {
  pathToMinutes: 'xxx',
  transcriptionName: 'yyy'
};

const mockFS = {
  chooseFile: jest.fn(() => Promise.resolve('xxx')),
  // 👇 must be valid minutes
  loadFile: jest.fn(() =>
    Promise.resolve(
      JSON.stringify({
        audio: {
          encoding: 'MP3',
          gcsuri: 'gs://yyy',
          sampleRateHertz: 1000,
          url: 'http://zzz'
        },
        date: '2023-06-28T23:00:00.000Z',
        title: 'xxx'
      })
    )
  )
};

const mockMetadata = {
  parseFile: jest.fn(() =>
    Promise.resolve({ encoding: 'MP3', sampleRateHertz: 44000 })
  )
};

const mockTranscriber = {
  cancelTranscription: jest.fn(() => Promise.resolve())
};

const mockUploader = {
  upload: jest.fn(() =>
    Promise.resolve({ gcsuri: 'gs://yyy', url: 'http://zzz' })
  )
};

Object.defineProperty(window, 'ipc', {
  value: {
    on: jest.fn()
  }
});

describe('AppState', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([AppState])],
      providers: [
        { provide: FSService, useValue: mockFS },
        { provide: MetadataService, useValue: mockMetadata },
        { provide: TranscriberService, useValue: mockTranscriber },
        { provide: UploaderService, useValue: mockUploader }
      ]
    });
    appState = TestBed.inject(AppState);
    store = TestBed.inject(Store);
    // 👇 set the store to its default state
    store.reset({ ...store.snapshot(), app: defaultState });
  });

  it('responds to CancelTranscription', () => {
    const state = store.selectSnapshot(AppState);
    expect(state.transcriptionName).toBe('yyy');
    store.dispatch(new CancelTranscription());
    expect(mockTranscriber.cancelTranscription).toHaveBeenCalledWith({
      name: 'yyy'
    });
  });

  it('responds to NewMinutes', () => {
    store.dispatch(new NewMinutes()).subscribe((done) => {
      const state = store.selectSnapshot(AppState);
      expect(mockMetadata.parseFile).toHaveBeenCalledWith('xxx');
      expect(mockUploader.upload).toHaveBeenCalledWith(
        expect.objectContaining({ filePath: 'xxx' })
      );
      expect(state.pathToMinutes).toBe('xxx');
      done();
    });
  });

  it('responds to OpenMinutes', () => {
    store.dispatch(new OpenMinutes()).subscribe((done) => {
      const state = store.selectSnapshot(AppState);
      expect(state.pathToMinutes).toBe('xxx');
      done();
    });
  });
});
