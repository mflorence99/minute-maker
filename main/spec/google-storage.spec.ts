import { upload } from '../app/google-storage';

import 'jest-extended';

jest.mock('electron', () => ({
  ipcMain: {
    on: jest.fn()
  }
}));

const mockUpload = jest.fn(() => Promise.resolve());

jest.mock('@google-cloud/storage', () => {
  return {
    Storage: jest.fn().mockImplementation(() => {
      return {
        bucket: jest.fn(() => {
          return {
            upload: mockUpload
          };
        })
      };
    })
  };
});

describe('google-storage', () => {
  it('can upload a file', async () => {
    const request = {
      bucketName: 'staging.washington-app-319514.appspot.com',
      destFileName: 'test.mp3',
      filePath: '/home/mflo/mflorence99/minute-maker/renderer/assets/short.mp3'
    };
    await upload(null, request);
    expect(mockUpload).toHaveBeenCalledWith(
      request.filePath,
      expect.objectContaining({ destination: request.destFileName })
    );
  });
});
