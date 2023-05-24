import { RootModule } from '../module';
import { WaveSurferComponent } from './wavesurfer';
import { WaveSurferMarkersComponent } from './wavesurfer-markers';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockInstance } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import { ngMocks } from 'ng-mocks';

import WaveSurfer from 'wavesurfer.js';

jest.mock('wavesurfer.js', () => {
  return jest.fn().mockImplementation((params): Partial<WaveSurfer> => {
    const ons = {};
    return {
      addPlugin: jest.fn(),
      destroy: jest.fn(),
      destroyPlugin: jest.fn(),
      getActivePlugins: () => ({}),
      getCursorColor: () => params.cursorColor,
      init: jest.fn(() => ons['ready']?.()),
      initPlugin: jest.fn(),
      load: jest.fn(),
      on: jest.fn((event, fn): any => (ons[event] = fn)),
      params: params,
      unAll: jest.fn()
    };
  });
});

describe('WaveSurferComponent', () => {
  beforeEach(() => {
    MockInstance(
      WaveSurferMarkersComponent,
      'create',
      jest.fn().mockReturnValue({ name: 'markers' })
    );
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

  it('can be configured with params and exposes public methods', () => {
    const fixture = MockRender(WaveSurferComponent, {
      params: { cursorColor: '#123456' }
    });
    const self = fixture.point.componentInstance;
    expect(self.wavesurfer.getCursorColor()).toBe('#123456');
  });

  it('will bind to a WaveSurfer event on demand', () => {
    const fixture = MockRender(WaveSurferComponent, { zoom: jest.fn() });
    const self = fixture.point.componentInstance;
    expect(self.wavesurfer.on).toHaveBeenCalledWith('zoom', expect.anything());
  });

  it('will load plugins from ContentChildren', () => {
    const fixture = MockRender<WaveSurferComponent>(
      `<mm-wavesurfer><mm-wavesurfer-markers /></mm-wavesurfer>`
    );
    const self = fixture.point.componentInstance;
    const markers = ngMocks.findInstance(fixture, WaveSurferMarkersComponent);
    expect(markers.create).toHaveBeenCalledWith();
    expect(self.wavesurfer.initPlugin).toHaveBeenCalledWith('markers');
  });
});
