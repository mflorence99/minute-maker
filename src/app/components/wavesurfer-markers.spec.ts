import { RootModule } from '../module';
import { WaveSurferMarkersComponent } from './wavesurfer-markers';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

import MarkersPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.markers.min.js';

jest.mock('wavesurfer.js/dist/plugin/wavesurfer.markers.min.js', () => {
  return {
    create: jest.fn((_): MarkersPlugin => null)
  };
});

describe('WaveSurferMarkersComponent', () => {
  beforeEach(() => MockBuilder(WaveSurferMarkersComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferMarkersComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can configure the plugin with markers', () => {
    const params = {
      markers: [
        {
          time: 5.5,
          label: 'V1',
          color: '#ff990a'
        },
        {
          time: 10,
          label: 'V2',
          color: '#00ffcc',
          position: 'top'
        }
      ]
    };
    const fixture = MockRender(WaveSurferMarkersComponent, {
      params
    });
    const self = fixture.point.componentInstance;
    self.create();
    expect(MarkersPlugin.create).toHaveBeenCalledWith(params);
  });
});
