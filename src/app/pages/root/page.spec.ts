import { RootModule } from '../../module';
import { RootPage } from './page';

import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';

describe('RootPage', () => {
  beforeEach(() => MockBuilder(RootPage, RootModule));

  it('should create the page', () => {
    const fixture = MockRender(RootPage);
    expect(fixture.point.componentInstance).toBeDefined();
  });
});
