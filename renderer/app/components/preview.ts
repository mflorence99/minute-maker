import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfigStateModel } from '#mm/state/config';
import { DomSanitizer } from '@angular/platform-browser';
import { ExporterService } from '#mm/services/exporter';
import { Minutes } from '#mm/common';
import { SafeHtml } from '@angular/platform-browser';

import { computed } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-preview',
  template: `
    <article>
      <iframe [attr.srcdoc]="rendering()"></iframe>
      <button
        (click)="export()"
        appearance="mono"
        icon="tuiIconDownload"
        tuiButton
        size="xs">
        Export
      </button>
    </article>
  `,
  styles: [
    `
      article {
        align-items: flex-end;
        display: flex;
        flex-direction: column;
        height: 100%;

        iframe {
          height: 95%;
          width: 100%;
        }
      }
    `
  ]
})
export class PreviewComponent {
  config = input.required<ConfigStateModel>();
  minutes = input.required<Minutes>();
  rendering = computed<SafeHtml>(() => {
    const raw = this.#exporter.render(this.config(), this.minutes(), 0.8);
    return this.#sanitizer.bypassSecurityTrustHtml(raw);
  });

  #exporter = inject(ExporterService);
  #sanitizer = inject(DomSanitizer);

  export(): void {
    this.#exporter.export(this.config(), this.minutes());
  }
}
