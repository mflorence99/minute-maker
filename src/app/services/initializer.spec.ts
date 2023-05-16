import { InitializerService } from './initializer';

import { environment } from '../environment';
import { initializeAppProvider } from './initializer';

import 'jest-extended';

import { clearMocks } from '@tauri-apps/api/mocks';
import { lastValueFrom } from 'rxjs';
import { mockIPC } from '@tauri-apps/api/mocks';

describe('InitializerService', () => {
  beforeEach(() => {
    // 🔥 we don't care what Tauri API is called,
    //    we only "know" at least one is
    mockIPC(() => null);
  });

  afterEach(() => clearMocks());

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
