import { RootModule } from '../module';
import { WaveSurferComponent } from './wavesurfer';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import WaveSurfer from 'wavesurfer.js';

jest.mock('wavesurfer.js', () => {
  return {
    create: (): WaveSurfer => {
      return {
        load: jest.fn()
      } as any;
    }
  };
});

describe('WaveSurferComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('loaded an audio file', () => {
    const fixture = MockRender(WaveSurferComponent);
    const self = fixture.point.componentInstance;
    expect(self.wavesurfer.load).toHaveBeenCalledOnceWith(
      './assets/minutes.mp3'
    );
  });
});
