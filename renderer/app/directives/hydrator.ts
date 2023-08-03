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

  #element = inject(ElementRef);
  #hydrateables: { [uuid: string]: Hydrateable } = {};
  #observer: IntersectionObserver;

  ngOnInit(): void {
    this.#observer = new IntersectionObserver(this.#callback.bind(this), {
      root: this.#element.nativeElement,
      rootMargin: this.hydratorMargin,
      threshold: [0]
    });
  }

  registerHydrateable(hydrateable: Hydrateable): void {
    this.#hydrateables[hydrateable.mmHydrated] = hydrateable;
    this.#observer.observe(hydrateable.element.nativeElement);
  }

  unregisterHydrateable(hydrateable: Hydrateable): void {
    // NOTE: this can fail depending on the order in which things are destroyed
    try {
      this.#observer.unobserve(hydrateable.element.nativeElement);
      delete this.#hydrateables[hydrateable.mmHydrated];
    } catch (ignored) {}
  }

  #callback(
    entries: IntersectionObserverEntry[],
    _observer: IntersectionObserver
  ): void {
    entries.forEach((entry) => {
      const hydrateable =
        this.#hydrateables[entry.target.getAttribute('mmHydrated')];
      if (hydrateable) {
        const isNow = entry.isIntersecting;
        const was = hydrateable.isHydrated;
        if (was !== isNow) {
          if (this.hydratorTrace) {
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
          hydrateable.isHydrated = isNow;
        }
      }
    });
  }
}
