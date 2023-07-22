import { Injectable } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { Minutes } from '#mm/common';
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

  export(minutes: Minutes, zoom = 1): void {
    try {
      // 👇 prepare the export from the minutes and the template
      const rendering = this.render(minutes, zoom);
      // 👇 export the resulting HTML
      const blob = new Blob([rendering], {
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

  render(minutes: Minutes, zoom = 1): string {
    // 👇 prepare the export from the minutes and the template
    const env = nunjucks.configure('./assets', { autoescape: false });
    const rendering = env.render('template.njk', {
      dayjs,
      fromMarkdown: this.#markdown.parse.bind(this.#markdown),
      minutes,
      zoom
    });
    return rendering;
  }
}
