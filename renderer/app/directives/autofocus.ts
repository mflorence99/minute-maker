import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

@Directive({
  selector: '[mmAutofocus]'
})
export class AutofocusDirective {
  mmAutofocus = input<boolean>(false);

  #host = inject(ElementRef);

  constructor() {
    effect(() => {
      if (this.mmAutofocus()) this.#host.nativeElement.focus();
    });
  }
}
