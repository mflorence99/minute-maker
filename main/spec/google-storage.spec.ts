import { upload } from '../app/google-storage';

import 'jest-extended';

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn()
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
    const { gcsuri, url } = await upload(null, request);
    expect(gcsuri).toBe(`gs://${request.bucketName}/${request.destFileName}`);
    expect(url).toBe(
      `https://storage.googleapis.com/${request.bucketName}/${request.destFileName}`
    );
    expect(mockUpload).toHaveBeenCalledWith(
      request.filePath,
      expect.objectContaining({ destination: request.destFileName })
    );
  });
});
