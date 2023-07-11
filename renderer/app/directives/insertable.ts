import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';

import { inject } from '@angular/core';

// 👇 this directive doesn't do much, but it affirmatively
//    annotates those elements before which a new element
//    can be inserted

@Directive({
  selector: 'textarea[mmInsertable]'
})
export class InsertableDirective {
  @Input({ required: true }) mmInsertable: number;

  #host = inject(ElementRef<HTMLTextAreaElement>);

  constructor() {
    this.#host.nativeElement['mmInsertable'] = this;
  }
}
