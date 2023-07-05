import 'jest-extended';

import { MockBuilder } from 'ng-mocks';
import { MockRender } from 'ng-mocks';
import { RootModule } from '#mm/module';
import { TranscriptionComponent } from '#mm/components/transcription';

describe('TranscriptionComponent', () => {
  beforeEach(() => MockBuilder(TranscriptionComponent, RootModule));

  it('should create the component', () => {
    const fixture = MockRender(TranscriptionComponent);
    const self = fixture.point.componentInstance;
    expect(self).toBeDefined();
  });
});
