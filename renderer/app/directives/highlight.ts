import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { HostListener } from '@angular/core';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { WINDOW } from '@ng-web-apis/common';

import { inject } from '@angular/core';

@Directive({
  selector: 'input[mmHighlight], textarea[mmHighlight]'
})
export class HighlightDirective implements OnDestroy, OnInit {
  @Input({ required: true }) mmHighlight: string;

  // 👇 not what we do in other directives, but this is all about DOM
  #host = inject(ElementRef).nativeElement;
  #observer: ResizeObserver;
  #underlay: HTMLDivElement;
  #window = inject(WINDOW);

  constructor() {
    this.#observer = this.#makeResizeObserver();
  }

  @HostListener('input') onInput(): void {
    this.#underlay.innerHTML = this.#toHTML(this.#host.value);
  }

  ngOnDestroy(): void {
    this.#observer.unobserve(this.#host);
    this.#underlay.remove();
  }

  ngOnInit(): void {
    this.#underlay = this.#makeUnderlay();
    this.#observer.observe(this.#host);
  }

  #makeResizeObserver(): ResizeObserver {
    return new ResizeObserver((entries) => {
      entries
        // 👇 make sure there's only one, our host!
        .filter((entry) => entry.target === this.#host)
        .forEach((entry) => {
          this.#underlay.style.height = `${entry.contentBoxSize[0].blockSize}px`;
          this.#underlay.style.left = `${entry.contentRect.x}px`;
          this.#underlay.style.top = `${entry.contentRect.y}px`;
          this.#underlay.style.width = `${entry.contentBoxSize[0].inlineSize}px`;
        });
    });
  }

  #makeUnderlay(): HTMLDivElement {
    const div = this.#window.document.createElement('div');
    this.#host.parentElement.style.position = 'relative';
    this.#host.parentElement.appendChild(div);
    div.innerHTML = this.#toHTML(this.#host.value);
    const style = this.#window.getComputedStyle(this.#host);
    div.style.color = style.backgroundColor;
    div.style.fontSize = style.fontSize;
    div.style.fontWeight = style.fontWeight;
    div.style.lineHeight = style.lineHeight;
    div.style.margin = style.margin;
    div.style.padding = style.padding;
    div.style.position = 'absolute';
    div.style.zIndex = '-1';
    return div;
  }

  #toHTML(text: string): string {
    let html = text.replaceAll('\n', '<br />');
    if (this.mmHighlight)
      html = html.replaceAll(
        this.mmHighlight,
        `<mark>${this.mmHighlight}</mark>`
      );
    return html;
  }
}
