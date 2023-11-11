import { ConfigStateModel } from '#mm/state/config';
import { Constants } from '#mm/common';
import { Injectable } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { Minutes } from '#mm/common';

import { inject } from '@angular/core';
import { saveAs } from 'file-saver';

import dayjs from 'dayjs';
import nunjucks from 'nunjucks';

@Injectable({ providedIn: 'root' })
export class ExporterService {
  #markdown = inject(MarkdownService);

  export(config: ConfigStateModel, minutes: Minutes, zoom = 1): void {
    // 👇 prepare the export from the minutes and the template
    const rendering = this.render(config, minutes, zoom);
    // 👇 export the resulting HTML
    const blob = new Blob([rendering], {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(
      blob,
      `${minutes.subject} ${dayjs(minutes.date).format('YYYY-MM-DD')}.html`
    );
  }

  render(config: ConfigStateModel, minutes: Minutes, zoom = 1): string {
    // 👇 prepare the export from the minutes and the template
    const env = nunjucks.configure('./assets', { autoescape: false });
    const rendering = env.render('template.njk', {
      dayjs,
      fromMarkdown: this.#markdown.parse.bind(this.#markdown),
      minutes,
      openaiChatCompletionModel:
        Constants.openaiModels[config.openaiChatCompletionModel],
      transcriber: {
        description:
          Constants.transcriptionImpls[config.transcriptionImpl].description,
        link: Constants.transcriptionImpls[config.transcriptionImpl].link
      },
      zoom
    });
    return rendering;
  }
}
