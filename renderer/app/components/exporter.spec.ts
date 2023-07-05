import 'jest-extended';

import { ExporterComponent } from '#mm/components/exporter';
import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';
import { RootModule } from '#mm/module';

jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

jest.mock('nunjucks', () => ({
  configure: jest.fn(() => ({
    render: jest.fn()
  }))
}));

describe('ExporterComponent', () => {
  beforeEach(() => MockBuilder(ExporterComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(ExporterComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });

  it('can export minutes', () => {
    const fixture = MockRender(ExporterComponent);
    const self = fixture.point.componentInstance;
    self.export();
    // 👇 just looking to complete without error
    expect(true).toBeTrue();
  });
});
