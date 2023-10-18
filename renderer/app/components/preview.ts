import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfigStateModel } from '#mm/state/config';
import { DomSanitizer } from '@angular/platform-browser';
import { ExporterService } from '#mm/services/exporter';
import { Input } from '@angular/core';
import { Minutes } from '#mm/common';
import { OnChanges } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-preview',
  template: `
    <article>
      <iframe [attr.srcdoc]="rendering"></iframe>
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
export class PreviewComponent implements OnChanges {
  @Input({ required: true }) config: ConfigStateModel;
  @Input({ required: true }) minutes: Minutes;

  rendering: SafeHtml;

  #exporter = inject(ExporterService);
  #sanitizer = inject(DomSanitizer);

  export(): void {
    this.#exporter.export(this.config, this.minutes);
  }

  ngOnChanges(): void {
    const raw = this.#exporter.render(this.config, this.minutes, 0.8);
    this.rendering = this.#sanitizer.bypassSecurityTrustHtml(raw);
  }
}
