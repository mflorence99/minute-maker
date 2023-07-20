import 'jest-extended';

import { AppState } from '#mm/state/app';
import { AudioMetadataService } from '#mm/services/audio-metadata';
import { CancelTranscription } from '#mm/state/app';
import { ConfigState } from '#mm/state/config';
import { FSService } from '#mm/services/fs';
import { MinutesState } from '#mm/state/minutes';
import { NewMinutes } from '#mm/state/app';
import { NgxsModule } from '@ngxs/store';
import { OpenAIService } from '#mm/services/openai';
import { OpenMinutes } from '#mm/state/app';
import { RephraseTranscription } from '#mm/state/app';
import { SaveMinutes } from '#mm/state/app';
import { SetMinutes } from '#mm/state/minutes';
import { Store } from '@ngxs/store';
import { SummarizeMinutes } from '#mm/state/app';
import { TestBed } from '@angular/core/testing';
import { TranscribeAudio } from '#mm/state/app';
import { TranscriberService } from '#mm/services/transcriber';
import { UploaderService } from '#mm/services/uploader';

import { of } from 'rxjs';

let store: Store;

const defaultState = {
  pathToMinutes: 'xxx',
  transcriptionName: 'yyy'
};

const transcription = [
  {
    speaker: '1',
    speech: 'hello, world!',
    start: 0,
    type: 'TX'
  }
];

const minutes = {
  audio: {
    encoding: 'MP3',
    gcsuri: 'gs://yyy',
    sampleRateHertz: 1000,
    url: 'http://zzz'
  },
  title: 'xxx',
  transcription: transcription
};

const mockFS = {
  chooseFile: jest.fn(() => Promise.resolve('xxx')),
  loadFile: jest.fn(() => Promise.resolve(JSON.stringify(minutes))),
  saveFile: jest.fn(() => Promise.resolve()),
  saveFileAs: jest.fn(() => Promise.resolve('yyy'))
};

const mockMetadata = {
  parseFile: jest.fn(() =>
    Promise.resolve({ encoding: 'MP3', sampleRateHertz: 44000 })
  )
};

const mockOpenAI = {
  chatCompletion: jest.fn(() =>
    Promise.resolve({ finish_reason: 'stop', text: 'xxx' })
  )
};

const mockTranscriber = {
  cancelTranscription: jest.fn(() => Promise.resolve()),
  transcribe: jest.fn(() =>
    of(
      { name: 'yyy', progressPercent: 50 },
      { name: 'yyy', progressPercent: 100, transcription }
    )
  )
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
      imports: [NgxsModule.forRoot([AppState, ConfigState, MinutesState])],
      providers: [
        { provide: FSService, useValue: mockFS },
        { provide: AudioMetadataService, useValue: mockMetadata },
        { provide: OpenAIService, useValue: mockOpenAI },
        { provide: TranscriberService, useValue: mockTranscriber },
        { provide: UploaderService, useValue: mockUploader }
      ]
    });
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

  it('responds to RephraseTranscription', () => {
    store.dispatch(new SetMinutes(minutes as any));
    store
      .dispatch(new RephraseTranscription('accuracy', 0))
      .subscribe((done) => {
        expect(mockOpenAI.chatCompletion).toHaveBeenCalledWith(
          expect.objectContaining({ prompt: expect.anything() })
        );
        done();
      });
  });

  it('responds to SaveMinutes', () => {
    store.dispatch(new SetMinutes(minutes as any));
    store.dispatch(new SaveMinutes(true)).subscribe((done) => {
      const state = store.selectSnapshot(AppState);
      expect(state.pathToMinutes).toBe('yyy');
      done();
    });
  });

  it('responds to SummarizeMinutes', () => {
    store.dispatch(new SetMinutes(minutes as any));
    store.dispatch(new SummarizeMinutes('bullets')).subscribe((done) => {
      expect(mockOpenAI.chatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.anything() })
      );
      done();
    });
  });

  it('responds to TranscribeAudio', () => {
    store.dispatch(new SetMinutes(minutes as any));
    store.dispatch(new TranscribeAudio()).subscribe((done) => {
      expect(mockTranscriber.transcribe).toHaveBeenCalledWith();
      done();
    });
  });
});
