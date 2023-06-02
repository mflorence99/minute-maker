import { RootModule } from '../module';
import { WaveSurferComponent } from './wavesurfer';
import { WaveSurferRegionsComponent } from './wavesurfer-regions';

import 'jest-extended';

import { BehaviorSubject } from 'rxjs';
import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';
import { Subject } from 'rxjs';

import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import WaveSurfer from 'wavesurfer.js';

WaveSurfer.create = jest.fn((): any => {
  return {
    destroy: jest.fn()
  };
});

RegionsPlugin.create = jest.fn((): any => {
  const regions = [];
  return {
    addRegion: jest.fn((region) => regions.push(region)),
    clearRegions: jest.fn(() => (regions.length = 0)),
    getRegions: jest.fn(() => regions),
    destroy: jest.fn()
  };
});

const region1 = { id: 1, start: 100, end: 200 };
const region2 = { id: 2, start: 300, end: 400 };

describe('WaveSurferRegionsComponent', () => {
  beforeEach(() =>
    MockBuilder(WaveSurferRegionsComponent, RootModule).provide({
      provide: WaveSurferComponent,
      useValue: {
        ready: new BehaviorSubject(true),
        timeupdate: new Subject(),
        wavesurfer: WaveSurfer.create({ container: null })
      }
    })
  );

  it('should create the component', () => {
    const fixture = MockRender(WaveSurferRegionsComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('will add regions from ContentChildren', () => {
    const fixture = MockRender<WaveSurferRegionsComponent>(
      `<mm-wavesurfer-regions>
        <mm-wavesurfer-region [params]="region1" />
        <mm-wavesurfer-region [params]="region2" />
      </mm-wavesurfer-regions>`,
      { region1, region2 }
    );
    const self = fixture.point.componentInstance;
    expect(self.plugin.getRegions()).toIncludeAllPartialMembers([
      { id: 1 },
      { id: 2 }
    ]);
  });

  it('handles special regionEntered event', () => {
    const spy = jest.fn();
    const fixture = MockRender<WaveSurferRegionsComponent>(
      `<mm-wavesurfer-regions (regionEntered)="handler($event)">
        <mm-wavesurfer-region [params]="region1" />
        <mm-wavesurfer-region [params]="region2" />
      </mm-wavesurfer-regions>`,
      { handler: spy, region1, region2 }
    );
    const self = fixture.point.componentInstance;
    self.wavesurfer.timeupdate.next(50);
    expect(spy).toHaveBeenCalledWith(undefined);
    self.wavesurfer.timeupdate.next(150);
    expect(spy).toHaveBeenCalledWith(region1);
    self.wavesurfer.timeupdate.next(250);
    expect(spy).toHaveBeenCalledWith(undefined);
    self.wavesurfer.timeupdate.next(350);
    expect(spy).toHaveBeenCalledWith(region2);
  });
});
