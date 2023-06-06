import { Channels } from '../app/common';

import { cancelOperation } from '../app/google-speech';
import { longRunningRecognize } from '../app/google-speech';

import 'jest-extended';

const mockTranscriberResponse = jest.fn(() => {});

globalThis.theWindow = {
  webContents: {
    send: mockTranscriberResponse
  }
};

jest.mock('electron', () => ({
  ipcMain: {
    on: jest.fn()
  }
}));

const mockCancelOperation = jest.fn(() => Promise.resolve());

const mockCheckLongRunningRecognizeProgress = jest.fn(() => {
  return Promise.resolve({
    latestResponse: { done: true },
    metadata: { progressPercent: 100 }
  });
});

const mockLongRunningRecognize = jest.fn(() => {
  const response = {
    results: [
      {
        alternatives: [
          {
            words: [
              { speakerTag: '1', startTime: { seconds: 0 }, word: 'hello' },
              { speakerTag: '2', startTime: { seconds: 5 }, word: 'world' }
            ]
          }
        ]
      }
    ]
  };
  const operation = {
    name: 'op',
    promise: (): any => Promise.resolve([response])
  };
  return Promise.resolve([operation]);
});

jest.mock('@google-cloud/speech', () => {
  return {
    v1p1beta1: {
      SpeechClient: jest.fn().mockImplementation(() => {
        return {
          cancelOperation: mockCancelOperation,

          checkLongRunningRecognizeProgress:
            mockCheckLongRunningRecognizeProgress,

          longRunningRecognize: mockLongRunningRecognize
        };
      })
    }
  };
});

describe('google-speech', () => {
  it('calls SpeechClient longRunningRecognize', async () => {
    const request = { speakers: ['Bob', 'Ted', 'Carol', 'Alice'] };
    await longRunningRecognize(null, request as any);
    expect(mockLongRunningRecognize).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          diarizationSpeakerCount: request.speakers.length
        })
      })
    );
    expect(mockTranscriberResponse).toHaveBeenCalledWith(
      Channels.transcriberResponse,
      {
        name: 'op',
        progressPercent: 100,
        transcription: [
          { speaker: 'Bob', speech: 'hello', start: 0 },
          { speaker: 'Ted', speech: 'world', start: 5 }
        ]
      }
    );
  });

  it('calls SpeechClient cancelOperation', () => {
    const request = { name: 'Bob' };
    cancelOperation(null, request);
    expect(mockCancelOperation).toHaveBeenCalledWith(request);
  });
});
