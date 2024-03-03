import { Directive } from '@angular/core';
import { HostListener } from '@angular/core';

import { input } from '@angular/core';

@Directive({
  selector: '[mmSelectOnFocus]'
})
export class SelectOnFocusDirective {
  mmSelectOnFocus = input<boolean>(false);

  @HostListener('focus', ['$event']) onFocus(event: any): void {
    setTimeout(() => {
      if (this.mmSelectOnFocus()) event.target.select();
    }, 0);
  }
}
