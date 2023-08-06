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
  @Input({ required: true }) mmHydrated: string;

  #cdf = inject(ChangeDetectorRef);
  #host = inject(ElementRef);
  #hydrator = inject(HydratorDirective);
  #isHydrated = false;

  get isHydrated(): boolean {
    return this.#isHydrated;
  }

  set isHydrated(isHydrated: boolean) {
    this.#isHydrated = isHydrated;
    const element = this.#host.nativeElement;
    if (this.isHydrated) element.style = '';
    else element.style = 'height: 200px';
    this.#cdf.markForCheck();
  }

  ngOnDestroy(): void {
    const element = this.#host.nativeElement;
    this.#hydrator.unregisterHydrateable(element);
  }

  ngOnInit(): void {
    const element = this.#host.nativeElement;
    if (!this.isHydrated) element.style = 'height: 200px';
    element['mmHydrated'] = this;
    this.#hydrator.registerHydrateable(element);
  }
}

// 👇 avoid circular dependency in HydratorDirective

export interface Hydrateable {
  isHydrated: boolean;
  mmHydrated: string;
}
