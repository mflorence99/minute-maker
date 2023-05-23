import { RootModule } from '../module';
import { WaveSurferComponent } from './wavesurfer';
import { WaveSurferMarkersComponent } from './wavesurfer-markers';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import { ngMocks } from 'ng-mocks';

import WaveSurfer from 'wavesurfer.js';

jest.mock('wavesurfer.js', () => {
  return {
    create: (params): Partial<WaveSurfer> => {
      return {
        getCursorColor: () => params.cursorColor,
        load: jest.fn(),
        on: jest.fn(),
        unAll: jest.fn()
      };
    }
  };
});

describe('WaveSurferComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferComponent, RootModule));

  afterEach(() => jest.resetAllMocks());

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
    expect(self.wavesurfer.load).toHaveBeenCalledOnceWith(
      './assets/minutes.mp3'
    );
  });

  it('can load an audio file on demand', () => {
    const fixture = MockRender(WaveSurferComponent);
    const self = fixture.point.componentInstance;
    self.audioFile = './assets/minutes.mp3';
    expect(self.audioFile).toBe('./assets/minutes.mp3');
    expect(self.wavesurfer.load).toHaveBeenCalledOnceWith(
      './assets/minutes.mp3'
    );
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
    expect(self.wavesurfer.on).toHaveBeenCalledOnceWith(
      'zoom',
      expect.anything()
    );
  });

  it('will load plugins from ContentChildren', () => {
    const fixture = MockRender<WaveSurferComponent>(
      `<mm-wavesurfer><mm-wavesurfer-markers /></mm-wavesurfer>`
    );
    const markers = ngMocks.findInstance(fixture, WaveSurferMarkersComponent);
    expect(markers.create).toHaveBeenCalledWith();
  });
});
