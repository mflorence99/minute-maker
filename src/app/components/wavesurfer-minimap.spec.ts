import { RootModule } from '../module';
import { WaveSurferMinimapComponent } from './wavesurfer-minimap';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js';

jest.mock('wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js', () => {
  return {
    create: jest.fn((_): MinimapPlugin => null)
  };
});

describe('WaveSurferMinimapComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferMinimapComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferMinimapComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can configure the plugin with params', () => {
    const params = { waveColor: '#123456' };
    const fixture = MockRender(WaveSurferMinimapComponent, {
      params
    });
    const self = fixture.point.componentInstance;
    self.create();
    expect(MinimapPlugin.create).toHaveBeenCalledWith(
      expect.objectContaining(params)
    );
  });
});
