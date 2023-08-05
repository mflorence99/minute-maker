import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { HydratorDirective } from '#mm/directives//hydrator';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';

import { inject } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

@Directive({
  exportAs: 'hydrated',
  selector: '[mmHydrated]'
})
export class HydratedDirective implements Hydrateable, OnDestroy, OnInit {
  @Output() hydrated = new EventEmitter<boolean>();

  @Input() mmHydrated = uuidv4();

  element = inject(ElementRef);

  #hydrated = false;
  #hydrator = inject(HydratorDirective);

  @Input()
  get isHydrated(): boolean {
    return this.#hydrated;
  }

  set isHydrated(hydrated: boolean) {
    this.hydrated.emit(hydrated);
    this.#hydrated = hydrated;
  }

  ngOnDestroy(): void {
    this.#hydrator.unregisterHydrateable(this);
  }

  ngOnInit(): void {
    this.element.nativeElement.setAttribute('mmHydrated', this.mmHydrated);
    this.#hydrator.registerHydrateable(this);
  }
}

// 👇 avoid circular dependency in HydratorDirective

export interface Hydrateable {
  element: ElementRef;
  isHydrated: boolean;
  mmHydrated: string;
}
