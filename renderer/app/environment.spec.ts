import { environment } from './environment';

import 'jest-extended';

describe('environment', () => {
  it('should be initialized correctly', () => {
    expect(environment.package.author).toBe('Mark Florence');
    expect(environment.package.name).toBe('minute-maker');
    expect(environment.package.description).toBe('Minute Maker');
    expect(environment.package.license).toBe('MIT');
  });

  it('mode is set for prod', () => {
    environment.production = true;
    expect(environment.mode()).toBe('prod');
    expect(environment.production).toBeTrue();
  });

  it('mode is set for dev', () => {
    environment.production = false;
    expect(environment.mode()).toBe('dev');
    expect(environment.production).toBeFalse();
  });
});
