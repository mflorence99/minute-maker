import { metadataParseFile } from '../app/audio-metadata';

import 'jest-extended';

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn()
  }
}));

jest.mock('music-metadata', () => ({
  parseFile: jest.fn(() => Promise.resolve({ format: { bitrate: 100 } }))
}));

describe('fs', () => {
  it('can parse an audio file', async () => {
    const fileName =
      '/home/mflo/mflorence99/minute-maker/renderer/assets/short.mp3';
    const metadata = await metadataParseFile(null, fileName);
    expect(metadata.bitrate).toBe(100);
    expect(metadata.encoding).toBe('MP3');
  });
});
