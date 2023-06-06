import { Channels } from '#mm/common';
import { TranscriberService } from '#mm/services/transcriber';

const transcription = { name: 'Bob', progressPercent: 100 };

Object.defineProperty(window, 'ipc', {
  value: {
    on: jest.fn((channel, listener) => listener('event', transcription)),
    removeListener: jest.fn(),
    send: jest.fn()
  }
});

declare const ipc;

describe('TranscriberService', () => {
  it('can be initialized', () => {
    const transcriber = new TranscriberService();
    expect(transcriber).toBeDefined();
  });

  it('creates an Observer of a transcription', (done) => {
    const transcriber = new TranscriberService();
    // 👇 the request is not important
    const subscription = transcriber
      .transcribe({} as any)
      .subscribe((response) => {
        expect(response).toBe(transcription);
        done();
      });
    expect(ipc.on).toHaveBeenCalledWith(
      Channels.transcriberResponse,
      expect.anything()
    );
    expect(ipc.send).toHaveBeenCalledWith(
      Channels.transcriberRequest,
      expect.anything()
    );
    subscription.unsubscribe();
    expect(ipc.removeListener).toHaveBeenCalledWith(
      Channels.transcriberResponse,
      expect.anything()
    );
  });
});
