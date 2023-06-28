import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';
import { RootModule } from '#mm/module';
import { WaveSurferComponent } from '#mm/components/wavesurfer';
import { WaveSurferTimelineComponent } from '#mm/components/wavesurfer-timeline';

import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';
import WaveSurfer from 'wavesurfer.js';

WaveSurfer.create = jest.fn((): any => {
  const ons = {};
  return {
    destroy: jest.fn(),
    load: jest.fn(),
    on: jest.fn((event, fn): any => (ons[event] = fn)),
    once: jest.fn((event, fn): any => (ons[event] = fn))
  };
});

TimelinePlugin.create = jest.fn((): any => {
  return {
    destroy: jest.fn()
  };
});

describe('WaveSurferComponent', () => {
  beforeEach(() =>
    MockBuilder(WaveSurferComponent, RootModule).keep(
      WaveSurferTimelineComponent
    )
  );

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

  it('will load plugins from ContentChildren', () => {
    MockRender<WaveSurferComponent>(
      `<mm-wavesurfer><mm-wavesurfer-timeline /></mm-wavesurfer>`
    );
    expect(TimelinePlugin.create).toHaveBeenCalledWith(expect.anything());
  });
});
