import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';
import { RootModule } from '#mm/module';
import { SummaryComponent } from '#mm/components/summary';

describe('SummaryComponent', () => {
  beforeEach(() => MockBuilder(SummaryComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(SummaryComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });
});
