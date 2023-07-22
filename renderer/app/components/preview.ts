import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ExporterService } from '#mm/services/exporter';
import { Input } from '@angular/core';
import { Minutes } from '#mm/common';
import { SafeHtml } from '@angular/platform-browser';

import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mm-preview',
  template: `
    <iframe [attr.srcdoc]="render()"></iframe>
  `
})
export class PreviewComponent {
  @Input({ required: true }) minutes: Minutes;

  #exporter = inject(ExporterService);
  #sanitizer = inject(DomSanitizer);

  render(): SafeHtml {
    const rendering = this.#exporter.render(this.minutes, 0.8);
    return this.#sanitizer.bypassSecurityTrustHtml(rendering);
  }
}
