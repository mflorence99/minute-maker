import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';
import { RootModule } from '#mm/module';
import { WaveSurferTimelineComponent } from '#mm/components/wavesurfer-timeline';

import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';

TimelinePlugin.create = jest.fn((): any => {
  return {
    destroy: jest.fn()
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
