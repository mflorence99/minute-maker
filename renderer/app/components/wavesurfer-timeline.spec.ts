import { RootModule } from '../module';
import { WaveSurferTimelineComponent } from './wavesurfer-timeline';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';

jest.mock('wavesurfer.js/dist/plugins/timeline', () => {
  return {
    create: jest.fn((): any => null)
  };
});

describe('WaveSurferTimelineComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferTimelineComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferTimelineComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can configure the plugin with params', () => {
    const options = { duration: 100 };
    const fixture = MockRender(WaveSurferTimelineComponent, {
      options
    });
    const self = fixture.point.componentInstance;
    self.create();
    expect(TimelinePlugin.create).toHaveBeenCalledWith(
      expect.objectContaining(options)
    );
  });
});
