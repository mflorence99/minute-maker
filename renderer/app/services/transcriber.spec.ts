import { TranscriberService } from '#mm/services/transcriber';

// 🔥 currently testing REAL API

describe('TranscriberService', () => {
  it('can be initialized', () => {
    const transcriber = new TranscriberService();
    expect(transcriber).toBeDefined();
  });
});
