import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';

import { inject } from '@angular/core';

// 👇 this directive doesn't do much, but it affirmatively
//    annotates those elements whose contents can be removed

@Directive({
  selector: 'textarea[mmRemovable]'
})
export class RemovableDirective {
  @Input({ required: true }) mmRemovable: number;

  #host = inject(ElementRef<HTMLTextAreaElement>);

  constructor() {
    this.#host.nativeElement['mmRemovable'] = this;
  }
}
