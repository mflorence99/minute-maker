import { Channels } from '#mm/common';
import { UploaderService } from '#mm/services/uploader';

Object.defineProperty(window, 'ipc', {
  value: {
    invoke: jest.fn()
  }
});

declare const ipc;

describe('OpenAIService', () => {
  it('invokes the uploaderRequest channel', () => {
    const uploader = new UploaderService();
    const request = {
      bucketName: 'staging.washington-app-319514.appspot.com',
      destFileName: 'test.mp3',
      filePath: '/home/mflo/mflorence99/minute-maker/renderer/assets/short.mp3'
    };
    uploader.upload(request);
    expect(ipc.invoke).toHaveBeenCalledWith(Channels.uploaderRequest, request);
  });
});
