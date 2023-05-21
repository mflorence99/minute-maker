import { WatchableEventEmitter } from './utils';

import { kebabasize } from './utils';

import 'jest-extended';

// 🙈 https://stackoverflow.com/questions/63116039/camelcase-to-kebab-case
describe('kebabasize function', () => {
  it('converts camelCase to kebab-case', () => {
    const words = [
      'StackOverflow',
      'camelCase',
      'alllowercase',
      'ALLCAPITALLETTERS',
      'CustomXMLParser',
      'APIFinder',
      'JSONResponseData',
      'Person20Address',
      'UserAPI20Endpoint'
    ];
    expect(words.map(kebabasize)).toStrictEqual([
      'stack-overflow',
      'camel-case',
      'alllowercase',
      'allcapitalletters',
      'custom-xml-parser',
      'api-finder',
      'json-response-data',
      'person20-address',
      'user-api20-endpoint'
    ]);
  });
});

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
