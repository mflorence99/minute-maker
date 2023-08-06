import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Hydrateable } from '#mm/directives//hydrated';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

import { inject } from '@angular/core';

@Directive({
  selector: '[mmHydrator]'
})
export class HydratorDirective implements OnInit {
  @Input() hydratorMargin = '0px';
  @Input() hydratorTrace = false;

  #host = inject(ElementRef);
  #observer: IntersectionObserver;

  ngOnInit(): void {
    this.#observer = new IntersectionObserver(this.#callback.bind(this), {
      root: this.#host.nativeElement,
      rootMargin: this.hydratorMargin,
      threshold: [0]
    });
  }

  registerHydrateable(element: HTMLElement): void {
    this.#observer.observe(element);
  }

  unregisterHydrateable(element: HTMLElement): void {
    this.#observer.unobserve(element);
  }

  #callback(
    entries: IntersectionObserverEntry[],
    _observer: IntersectionObserver
  ): void {
    entries.forEach((entry) => {
      const hydrateable: Hydrateable = entry.target['mmHydrated'];
      if (hydrateable) {
        const isNow = entry.isIntersecting;
        const was = hydrateable.isHydrated;
        if (was !== isNow) {
          if (this.hydratorTrace) {
            hydrateable.isHydrated = isNow;
            // 👇 trace hydration
            const uuid = hydrateable.mmHydrated;
            if (isNow)
              console.log(
                `%cHydrate %c${uuid}`,
                'color: #1b5e20',
                'color: grey'
              );
            else
              console.log(
                `%cDehydrate %c${uuid}`,
                'color: #b71c1c',
                'color: grey'
              );
          }
        }
      }
    });
  }
}
