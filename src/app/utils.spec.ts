import { CSSVariableProxy } from './utils';
import { WatchableEventEmitter } from './utils';

import { kebabasize } from './utils';

import 'jest-extended';

Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      appearance: ['-webkit-appearance'],
      display: 'none',
      getPropertyValue: (nm): string =>
        nm === '--test-b-d-e' ? '#123456' : null
    };
  }
});

describe('CSSVariableProxy', () => {
  it('substitutes a CSS variable for an equivalent property', () => {
    const params = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3
        }
      }
    };
    expect(params.b.d.e).toBe(3);
    const proxy = new CSSVariableProxy<typeof params>(null, 'test');
    const proxied = proxy.proxyFactory(params);
    expect(proxied.b.c).toBe(2);
    expect(proxied.b.d.e).toBe('#123456');
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
