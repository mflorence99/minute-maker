import { RootModule } from '../module';
import { WaveSurferSpectrogramComponent } from './wavesurfer-spectrogram';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import SpectrogramPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram.min.js';

jest.mock('wavesurfer.js/dist/plugin/wavesurfer.spectrogram.min.js', () => {
  return {
    create: jest.fn((_): SpectrogramPlugin => null)
  };
});

describe('WaveSurferSpectrogramComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferSpectrogramComponent, RootModule));

  afterEach(() => jest.resetAllMocks());

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferSpectrogramComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can configure the plugin with params', () => {
    const params = { labels: true };
    const fixture = MockRender(WaveSurferSpectrogramComponent, {
      params
    });
    const self = fixture.point.componentInstance;
    self.create();
    expect(SpectrogramPlugin.create).toHaveBeenCalledWith(
      expect.objectContaining(params)
    );
  });
});
