import 'jest-extended';

import { WatchableEventEmitter } from '#mm/utils';

import { asBullets } from '#mm/utils';
import { asParagraphs } from '#mm/utils';
import { bufferCount } from 'rxjs';
import { from } from 'rxjs';
import { kebabasize } from '#mm/utils';
import { objectsHaveSameKeys } from '#mm/utils';
import { withPreviousItem } from '#mm/utils';

describe('class WatchableEventEmitter', () => {
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
describe('function kebabasize', () => {
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

describe('function asParagraphs', () => {
  it('correctly converts text into HTML', () => {
    const text = 'hello\n\nworld';
    const html = '<p>hello</p><p>world</p>';
    expect(asParagraphs(text)).toBe(html);
  });
});

describe('function asBullets', () => {
  it('correctly converts text into HTML', () => {
    const text = '- item1\n- item2\n- item3';
    const html = '<li>item1\n<li>item2\n<li>item3';
    expect(asBullets(text)).toBe(html);
  });
});

describe('function objectsHaveSameKeys', () => {
  it('correctly identifies similar objects', () => {
    const o1 = { a: 1, b: 2, c: 3 };
    const o2 = { c: 1, b: 2, a: 3 };
    expect(objectsHaveSameKeys(o1, o2)).toBeTrue();
  });
  it('correctly identifies dissimilar objects', () => {
    const o1 = { a: 1, b: 2, c: 3, d: 4 };
    const o2 = { c: 1, b: 2, a: 3, e: 5 };
    expect(objectsHaveSameKeys(o1, o2)).toBeFalse();
  });
});

describe('OperatorFunction withPreviousItem', () => {
  it('correctly associates each observed item with its prior value', (done) => {
    const items$ = from([1, 2, 3, 4]);
    items$.pipe(withPreviousItem(), bufferCount(8)).subscribe((result) => {
      expect(result).toStrictEqual([
        { current: 1, previous: undefined },
        { current: 2, previous: 1 },
        { current: 3, previous: 2 },
        { current: 4, previous: 3 }
      ]);
      done();
    });
  });
});
