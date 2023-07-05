import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MinutesState } from '#mm/state/minutes';
import { SetStatus } from '#mm/state/status';
import { Store } from '@ngxs/store';

import { asBullets } from '#mm/utils';
import { asParagraphs } from '#mm/utils';
import { inject } from '@angular/core';
import { saveAs } from 'file-saver';

import dayjs from 'dayjs';
import nunjucks from 'nunjucks';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-exporter',
  template: ``,
  styles: ['host { display: none; }']
})
export class ExporterComponent {
  #store = inject(Store);

  export(): void {
    try {
      // 👇 grab the latest minutes
      const minutes = this.#store.selectSnapshot(MinutesState);
      // 👇 prepare the export from the minutes and the template
      const env = nunjucks.configure('./assets', { autoescape: false });
      const result = env.render('template.njk', {
        asParagraphs,
        asBullets,
        dayjs,
        minutes,
        test: [1, 2, 3]
      });
      // 👇 export the resulting HTML
      const blob = new Blob([result], {
        type: 'text/plain;charset=utf-8'
      });
      saveAs(
        blob,
        `${minutes.subject} ${dayjs(minutes.date).format('YYYY-MM-DD')}.html`
      );
    } catch (error) {
      this.#store.dispatch(new SetStatus({ error }));
    }
  }
}
