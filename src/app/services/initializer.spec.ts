import { InitializerService } from './initializer';

import { environment } from '../environment';
import { initializeAppProvider } from './initializer';

import 'jest-extended';

import { lastValueFrom } from 'rxjs';

describe('InitializerService', () => {
  it('should return an Observable in production', () => {
    environment.production = true;
    const provider = initializeAppProvider(new InitializerService());
    expect(provider).toBeDefined();
    return lastValueFrom(provider()).then(() => expect(true).toBeTrue());
  });

  it('should return an Observable in dev mode', () => {
    environment.production = false;
    const provider = initializeAppProvider(new InitializerService());
    expect(provider).toBeDefined();
    return lastValueFrom(provider()).then(() => expect(true).toBeTrue());
  });
});
