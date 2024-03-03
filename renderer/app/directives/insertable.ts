import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

// 👇 this directive doesn't do much, but it affirmatively
//    annotates those elements before which a new element
//    can be inserted

@Directive({
  selector: 'textarea[mmInsertable]'
})
export class InsertableDirective {
  mmInsertable = input<number>();

  #host = inject(ElementRef<HTMLTextAreaElement>);

  constructor() {
    effect(() => {
      this.#host.nativeElement['mmInsertable'] = this;
    });
  }
}
