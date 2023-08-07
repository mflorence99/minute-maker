import { ChangeDetectorRef } from '@angular/core';
import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { HydratorDirective } from '#mm/directives//hydrator';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';

import { inject } from '@angular/core';

@Directive({
  exportAs: 'hydrated',
  selector: '[mmHydrated]'
})
export class HydratedDirective implements Hydrateable, OnDestroy, OnInit {
  @Input() hydratedHeight = 200;
  @Input({ required: true }) mmHydrated: string;

  #cdf = inject(ChangeDetectorRef);
  #host = inject(ElementRef);
  #hydrator = inject(HydratorDirective);
  #isHydrated = false;

  get isHydrated(): boolean {
    return this.#isHydrated;
  }

  set isHydrated(isHydrated: boolean) {
    if (this.#isHydrated !== isHydrated) {
      this.#isHydrated = isHydrated;
      const element = this.#host.nativeElement;
      // 👇 if hydrating, let the element take its natural height
      if (this.isHydrated) element.style = '';
      // 👇
      else {
        const height = element.offsetHeight || this.hydratedHeight;
        element.style = `height: ${height}px`;
      }
      // 👇 force Angular to redraw
      this.#cdf.markForCheck();
    }
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
    if (!this.isHydrated) element.style = `height: ${this.hydratedHeight}px`;
    // 👇 back pointer to firective for use by hydrator
    element['mmHydrated'] = this;
    // 👇 add element to hydrateables
    this.#hydrator.registerHydrateable(element);
  }
}

// 👇 avoid circular dependency in HydratorDirective

export interface Hydrateable {
  isHydrated: boolean;
  mmHydrated: string;
}
