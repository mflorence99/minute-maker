import { WatchableEventEmitter } from './utils';

import 'jest-extended';

describe('WatchableEventEmitter', () => {
  it('counts the number of active subscribers', () => {
    const watchable = new WatchableEventEmitter<string>();
    expect(watchable.subscriberCount).toBe(0);
    watchable.subscribe();
    expect(watchable.subscriberCount).toBe(1);
    watchable.unsubscribe();
    expect(watchable.subscriberCount).toBe(0);
  });
});
