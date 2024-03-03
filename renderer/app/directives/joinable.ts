import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';

import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

// 👇 this directive doesn't do much, but it affirmatively
//    annotates those elements whose contents can be joined

@Directive({
  selector: 'textarea[mmJoinable]'
})
export class JoinableDirective {
  mmJoinable = input<number>();

  #host = inject(ElementRef<HTMLTextAreaElement>);

  constructor() {
    effect(() => {
      this.#host.nativeElement['mmJoinable'] = this;
    });
  }
}
