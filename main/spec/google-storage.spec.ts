import { upload } from '../app/google-storage';

import 'jest-extended';

import { Storage } from '@google-cloud/storage';

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn()
  }
}));

jest.mock('@google-cloud/storage', () => {
  const mockUpload = jest.fn(() => Promise.resolve());
  return {
    Storage: jest.fn(() => {
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
    const storage = new Storage();
    const request = {
      bucketName: 'staging.washington-app-319514.appspot.com',
      destFileName: 'test.mp3',
      filePath: '/home/mflo/mflorence99/minute-maker/renderer/assets/short.mp3'
    };
    const { gcsuri, url } = await upload(null, request);
    expect(gcsuri).toBe(`gs://${request.bucketName}/${request.destFileName}`);
    expect(url).toBe(
      `https://storage.googleapis.com/${request.bucketName}/${request.destFileName}`
    );
    expect(storage.bucket(request.bucketName).upload).toHaveBeenCalledWith(
      request.filePath,
      expect.objectContaining({ destination: request.destFileName })
    );
  });
});
