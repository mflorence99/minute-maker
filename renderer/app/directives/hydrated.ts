import { ChangeDetectorRef } from '@angular/core';
import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { HydratorDirective } from '#mm/directives//hydrator';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Signal } from '@angular/core';
import { WritableSignal } from '@angular/core';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { signal } from '@angular/core';

@Directive({
  exportAs: 'hydrated',
  selector: '[mmHydrated]'
})
export class HydratedDirective implements Hydrateable, OnDestroy, OnInit {
  hydratedHeight = input<number>(200);
  isHydrated = signal<boolean>(false);
  mmHydrated = input.required<string>();

  #cdf = inject(ChangeDetectorRef);
  #host = inject(ElementRef);
  #hydrator = inject(HydratorDirective);

  constructor() {
    effect(() => {
      const element = this.#host.nativeElement;
      // 👇 if hydrating, let the element take its natural height
      if (this.isHydrated()) element.style = '';
      // 👇
      else {
        const height = element.offsetHeight || this.hydratedHeight();
        element.style = `height: ${height}px`;
      }
      // 👇 force Angular to redraw
      this.#cdf.markForCheck();
    });
  }

  ngOnDestroy(): void {
    const element = this.#host.nativeElement;
    // 👇 remove element from hydrateables
    this.#hydrator.unregisterHydrateable(element);
  }

  ngOnInit(): void {
    const element = this.#host.nativeElement;
    // 👇 set initial height for unhydrated elements
    //    just an approximation for the scrollbars to work!
    if (!this.isHydrated())
      element.style = `height: ${this.hydratedHeight()}px`;
    // 👇 back pointer to directive for use by hydrator
    element['mmHydrated'] = this;
    // 👇 add element to hydrateables
    this.#hydrator.registerHydrateable(element);
  }
}

// 👇 avoid circular dependency in HydratorDirective

export interface Hydrateable {
  isHydrated: WritableSignal<boolean>;
  mmHydrated: Signal<string>;
}
