import { RootModule } from '../module';
import { WaveSurferTimelineComponent } from './wavesurfer-timeline';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';

jest.mock('wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js', () => {
  return {
    create: jest.fn((_): TimelinePlugin => null)
  };
});

describe('WaveSurferTimelineComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferTimelineComponent, RootModule));

  afterEach(() => jest.resetAllMocks());

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferTimelineComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can configure the plugin with params', () => {
    const params = { primaryColor: '#123456' };
    const fixture = MockRender(WaveSurferTimelineComponent, {
      params
    });
    const self = fixture.point.componentInstance;
    self.create();
    expect(TimelinePlugin.create).toHaveBeenCalledWith(
      expect.objectContaining(params)
    );
  });
});
