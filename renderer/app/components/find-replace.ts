import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-find-replace',
  template: `
    <article>
      xxx
      <br />
      xxx
      <br />
      xxx
      <br />
      xxx
    </article>
  `,
  styles: []
})
export class FindReplaceComponent {}
