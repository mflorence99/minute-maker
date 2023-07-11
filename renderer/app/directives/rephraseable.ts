import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';

import { inject } from '@angular/core';

// 👇 this directive doesn't do much, but it affirmatively
//    annotates those elements whose contents can be rephrased

@Directive({
  selector: 'textarea[mmRephraseable]'
})
export class RephraseableDirective {
  @Input({ required: true }) mmRephraseable: number;

  #host = inject(ElementRef<HTMLTextAreaElement>);

  constructor() {
    this.#host.nativeElement['mmRephraseable'] = this;
  }
}
