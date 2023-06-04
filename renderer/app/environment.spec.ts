import 'jest-extended';

import { environment } from '#mm/environment';

describe('environment', () => {
  it('should be initialized correctly', () => {
    expect(environment.package.author).toBe('Mark Florence');
    expect(environment.package.name).toBe('minute-maker');
    expect(environment.package.description).toBe('Minute Maker');
    expect(environment.package.license).toBe('MIT');
  });
});
