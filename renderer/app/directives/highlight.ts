import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { HostListener } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { WINDOW } from '@ng-web-apis/common';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

@Directive({
  selector: 'input[mmHighlight], textarea[mmHighlight]'
})
export class HighlightDirective implements OnDestroy, OnInit {
  mmHighlight = input<string>();

  #observer: ResizeObserver;
  #textarea = inject(ElementRef).nativeElement; // 👈 textarea or input
  #underlay: HTMLDivElement;
  #window = inject(WINDOW);

  constructor() {
    this.#observer = this.#makeResizeObserver();
    effect(() => {
      this.#underlay.innerHTML = this.#toHTML(this.#textarea.value);
    });
  }

  @HostListener('input') onInput(): void {
    this.#underlay.innerHTML = this.#toHTML(this.#textarea.value);
  }

  ngOnDestroy(): void {
    this.#observer.unobserve(this.#textarea);
    this.#underlay.remove();
  }

  ngOnInit(): void {
    this.#underlay = this.#makeUnderlay();
    this.#observer.observe(this.#textarea);
  }

  #makeResizeObserver(): ResizeObserver {
    return new ResizeObserver((entries) => {
      entries
        // 👇 make sure there's only one, our host!
        .filter((entry) => entry.target === this.#textarea)
        .forEach((entry) => {
          this.#underlay.style.height = `${entry.contentBoxSize[0].blockSize}px`;
          // 🔥 defo isn't contentRect.x/y but not sure why it is zero
          //    maybe because we've accounted for margin/padding already?
          this.#underlay.style.left = '0'; // `${entry.contentRect.x}px`;
          this.#underlay.style.top = '0'; // `${entry.contentRect.y}px`;
          this.#underlay.style.width = `${entry.contentBoxSize[0].inlineSize}px`;
        });
    });
  }

  #makeUnderlay(): HTMLDivElement {
    const div = this.#window.document.createElement('div');
    this.#textarea.parentElement.style.position = 'relative';
    this.#textarea.parentElement.appendChild(div);
    div.innerHTML = this.#toHTML(this.#textarea.value);
    // 👇 just the essentials for now
    const style = this.#window.getComputedStyle(this.#textarea);
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
    if (this.mmHighlight()) {
      const regex = new RegExp(
        // 🔥 really need to DRY this!
        this.mmHighlight().replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'),
        'gi'
      );
      html = html.replaceAll(regex, `<mark>${this.mmHighlight()}</mark>`);
    }
    return html;
  }
}
