import { Injectable } from '@angular/core';

import { v1p1beta1 } from '@google-cloud/speech/';

@Injectable({ providedIn: 'root' })
export class TranscriberService {
  #client: v1p1beta1.SpeechClient;

  constructor() {
    this.#client = new v1p1beta1.SpeechClient();
  }
}
