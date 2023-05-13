import { environment } from '../../environment';

import { Component } from '@angular/core';

@Component({
  selector: 'mm-root',
  templateUrl: './page.html',
  styleUrls: ['./page.scss']
})
export class RootPage {
  env = environment;
}
