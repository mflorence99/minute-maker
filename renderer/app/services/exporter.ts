import { Injectable } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { MinutesState } from '#mm/state/minutes';
import { SetStatus } from '#mm/state/status';
import { Store } from '@ngxs/store';

import { inject } from '@angular/core';
import { saveAs } from 'file-saver';

import dayjs from 'dayjs';
import nunjucks from 'nunjucks';

@Injectable({ providedIn: 'root' })
export class ExporterService {
  #markdown = inject(MarkdownService);
  #store = inject(Store);

  export(): void {
    try {
      // 👇 grab the latest minutes
      const minutes = this.#store.selectSnapshot(MinutesState);
      // 👇 prepare the export from the minutes and the template
      const env = nunjucks.configure('./assets', { autoescape: false });
      const result = env.render('template.njk', {
        dayjs,
        fromMarkdown: this.#markdown.parse.bind(this.#markdown),
        minutes
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
