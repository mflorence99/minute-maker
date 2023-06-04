import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';
import { RootModule } from '#app/module';
import { WaveSurferRegionComponent } from '#app/components/wavesurfer-region';

describe('WaveSurferRegionComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferRegionComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferRegionComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can be configured with params', () => {
    const params = { start: 100, end: 200 };
    const fixture = MockRender(WaveSurferRegionComponent, {
      params
    });
    const self = fixture.point.componentInstance;
    expect(self.params).toStrictEqual(expect.objectContaining(params));
  });
});
