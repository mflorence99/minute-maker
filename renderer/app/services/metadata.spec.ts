import { Channels } from '#mm/common';
import { MetadataService } from '#mm/services/metadata';

Object.defineProperty(window, 'ipc', {
  value: {
    invoke: jest.fn()
  }
});

declare const ipc;

describe('MetadataService', () => {
  it('uses the metadataParseFile channel to choose a file', () => {
    const metadata = new MetadataService();
    const fileName =
      '/home/mflo/mflorence99/minute-maker/renderer/assets/short.mp3';
    metadata.parseFile(fileName);
    expect(ipc.invoke).toHaveBeenCalledWith(
      Channels.metadataParseFile,
      fileName
    );
  });
});
