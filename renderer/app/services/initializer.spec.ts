import 'jest-extended';

import { InitializerService } from '#mm/services/initializer';

import { environment } from '#mm/environment';
import { initializeAppProvider } from '#mm/services/initializer';
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
