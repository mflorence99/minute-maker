import { RootModule } from '../module';
import { WaveSurferRegionsComponent } from './wavesurfer-regions';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';

jest.mock('wavesurfer.js/dist/plugin/wavesurfer.regions.min.js', () => {
  return {
    create: jest.fn((_): RegionsPlugin => null)
  };
});

describe('WaveSurferRegionsComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferRegionsComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferRegionsComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can configure the plugin with regions', () => {
    const params = {
      regionsMinLength: 2,
      regions: [
        {
          start: 1,
          end: 3,
          loop: false,
          color: 'hsla(400, 100%, 30%, 0.5)'
        },
        {
          start: 5,
          end: 7,
          loop: false,
          color: 'hsla(200, 50%, 70%, 0.4)',
          minLength: 1,
          maxLength: 5
        }
      ],
      dragSelection: {
        slop: 5
      }
    };
    const fixture = MockRender(WaveSurferRegionsComponent, {
      params
    });
    const self = fixture.point.componentInstance;
    self.create();
    expect(RegionsPlugin.create).toHaveBeenCalledWith(params);
  });
});
