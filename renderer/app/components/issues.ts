import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Issue } from '#mm/state/issues';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-issues',
  template: ``,
  styles: [``]
})
export class IssuesComponent {
  @Input({ required: true }) issues: Issue[];
}
