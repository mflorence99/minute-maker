import { RootModule } from '../module';
import { WaveSurferComponent } from './wavesurfer';
import { WaveSurferTimelineComponent } from './wavesurfer-timeline';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import { ngMocks } from 'ng-mocks';

import WaveSurfer from 'wavesurfer.js';

jest.mock('wavesurfer.js');

WaveSurfer.create = jest.fn((): any => {
  const ons = {};
  return {
    destroy: jest.fn(),
    load: jest.fn(),
    on: jest.fn((event, fn): any => (ons[event] = fn))
  };
});

jest.mock('wavesurfer.js/dist/plugins/timeline', () => {
  return {
    create: jest.fn((): any => null)
  };
});

describe('WaveSurferComponent', () => {
  beforeEach(() => {
    return MockBuilder(WaveSurferComponent, RootModule);
  });

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can load an audio file as input', () => {
    const fixture = MockRender(WaveSurferComponent, {
      audioFile: './assets/minutes.mp3'
    });
    const self = fixture.point.componentInstance;
    expect(self.wavesurfer.load).toHaveBeenCalledWith('./assets/minutes.mp3');
  });

  it('can load an audio file on demand', () => {
    const fixture = MockRender(WaveSurferComponent);
    const self = fixture.point.componentInstance;
    self.audioFile = './assets/minutes.mp3';
    expect(self.audioFile).toBe('./assets/minutes.mp3');
    expect(self.wavesurfer.load).toHaveBeenCalledWith('./assets/minutes.mp3');
  });

  it('will bind to a WaveSurfer event on demand', () => {
    const fixture = MockRender(WaveSurferComponent, { zoom: jest.fn() });
    const self = fixture.point.componentInstance;
    expect(self.wavesurfer.on).toHaveBeenCalledWith('zoom', expect.anything());
  });

  it.skip('will load plugins from ContentChildren', () => {
    const fixture = MockRender<WaveSurferComponent>(
      `<mm-wavesurfer><mm-wavesurfer-timeline /></mm-wavesurfer>`
    );
    const timeline = ngMocks.findInstance(fixture, WaveSurferTimelineComponent);
    expect(timeline.create).toHaveBeenCalledWith();
  });
});
