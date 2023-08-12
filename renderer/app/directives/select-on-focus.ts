import { Directive } from '@angular/core';
import { HostListener } from '@angular/core';
import { Input } from '@angular/core';

@Directive({
  selector: '[mmSelectOnFocus]'
})
export class SelectOnFocusDirective {
  @Input() mmSelectOnFocus: boolean;

  @HostListener('focus', ['$event']) onFocus(event: any): void {
    setTimeout(() => {
      if (this.mmSelectOnFocus) event.target.select();
    }, 0);
  }
}
