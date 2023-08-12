import { AfterViewInit } from '@angular/core';
import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';

import { inject } from '@angular/core';

@Directive({
  selector: '[mmAutofocus]'
})
export class AutofocusDirective implements AfterViewInit, OnChanges {
  @Input() mmAutofocus;

  #host = inject(ElementRef);

  ngAfterViewInit(): void {
    this.#focus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.#focus();
    }
  }

  #focus(): void {
    if (this.mmAutofocus) this.#host.nativeElement.focus();
  }
}
