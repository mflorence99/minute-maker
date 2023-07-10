import { resolveAllPromises } from '../app/utils';
import { trunc } from '../app/utils';

import 'jest-extended';

describe('utils', () => {
  it('can truncate text longer than a certain maximum', () => {
    expect(trunc('123456', 5)).toBe('12345...');
    expect(trunc('123456', 6)).toBe('123456');
  });

  it('can recursively resolve promises in arbitrary objects', async () => {
    const obj = {
      a: 1,
      b: {
        c: Promise.resolve(2),
        d: {
          e: Promise.resolve(3)
        }
      }
    };
    const resolved = await resolveAllPromises(obj);
    expect(resolved).toStrictEqual({ a: 1, b: { c: 2, d: { e: 3 } } });
  });

  it.todo('is hard to test tuiSVGtoPNG without mocking everything');
});
