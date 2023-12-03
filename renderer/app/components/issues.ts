import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { Issue } from '#mm/state/issues';
import { Output } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-issues',
  template: `
    @if (issues.length > 0) {
      <table>
        <tbody>
          @for (issue of issues; track ix; let ix = $index) {
            <tr
              (click)="onSelected(issue)"
              class="issue"
              tuiHint="Click to fix issue"
              tuiHintAppearance="onDark">
              <td class="numeric">{{ ix + 1 }}.</td>
              <td>
                <tui-svg
                  src="tuiIconThumbsDown"
                  [style.color]="
                    'var(--tui-' + issue.severity + '-fill)'
                  "></tui-svg>
              </td>
              <td>{{ issue.message }}</td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      <tui-block-status>
        <img tuiSlot="top" src="./assets/meeting.png" />

        <p>There are no issues with these minutes.</p>
      </tui-block-status>
    }
  `,
  styles: [
    `
      .issue {
        cursor: pointer;
      }
    `
  ]
})
export class IssuesComponent {
  @Input({ required: true }) issues: Issue[];

  @Output() selected = new EventEmitter<Issue>();

  onSelected(issue: Issue): void {
    this.selected.emit(issue);
  }
}
