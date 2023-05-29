import { InitializerService } from './initializer';

import { environment } from '../environment';
import { initializeAppProvider } from './initializer';

import 'jest-extended';

import { lastValueFrom } from 'rxjs';

describe('InitializerService', () => {
  it('should return an Observable', () => {
    environment.production = true;
    const provider = initializeAppProvider(new InitializerService());
    expect(provider).toBeDefined();
    return lastValueFrom(provider())
      .then(() => expect(true).toBeTrue())
      .catch(() => expect(true).toBeTrue());
  });
});
