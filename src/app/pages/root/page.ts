import { Component } from '@angular/core';

@Component({
  selector: 'mm-root',
  templateUrl: './page.html',
  styleUrls: ['./page.scss']
})
export class RootPage {
  process(arg): void {
    console.log(`PROCESS ${arg}`);
  }
  ready(): void {
    console.log('READY!');
  }
}
