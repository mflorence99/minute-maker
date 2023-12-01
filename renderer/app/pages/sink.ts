import { AppStateModel } from '#mm/state/app';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentStateModel } from '#mm/state/component';
import { ConfigStateModel } from '#mm/state/config';
import { Input } from '@angular/core';
import { IssuesStateModel } from '#mm/state/issues';
import { MinutesStateModel } from '#mm/state/minutes';
import { StatusStateModel } from '#mm/state/status';

import { defaultApp } from '#mm/state/app';
import { defaultComponentState } from '#mm/state/component';
import { defaultConfig } from '#mm/state/config';
import { defaultIssues } from '#mm/state/issues';
import { defaultMinutes } from '#mm/state/minutes';
import { defaultStatus } from '#mm/state/status';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-sink',
  template: ``
})
export class SinkComponent {
  @Input() app: AppStateModel = defaultApp();
  @Input() componentState: ComponentStateModel = defaultComponentState();
  @Input() config: ConfigStateModel = defaultConfig();
  @Input() configured = false;
  @Input() issues: IssuesStateModel = defaultIssues();
  @Input() minutes: MinutesStateModel = defaultMinutes();
  @Input() status: StatusStateModel = defaultStatus();
  @Input() transcriptionRate = 1;
}
