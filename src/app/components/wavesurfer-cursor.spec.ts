import { RootModule } from '../module';
import { WaveSurferCursorComponent } from './wavesurfer-cursor';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js';

jest.mock('wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js', () => {
  return {
    create: jest.fn((_): CursorPlugin => null)
  };
});

describe('WaveSurfeCursorrComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferCursorComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferCursorComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can configure the plugin with params', () => {
    const params = { opacity: 1 };
    const fixture = MockRender(WaveSurferCursorComponent, {
      params
    });
    const self = fixture.point.componentInstance;
    self.create();
    expect(CursorPlugin.create).toHaveBeenCalledWith(params);
  });
});
