import { WaveSurferComponent } from '../../components/wavesurfer';

import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'mm-root',
  template: `
    <main>
      <mm-wavesurfer
        (markerClick)="xxx($event)"
        (markerContextmenu)="xxx($event)"
        (markerDrag)="xxx($event)"
        (markerDrop)="xxx($event)"
        [audioFile]="'./assets/minutes.mp3'"
        ><mm-wavesurfer-cursor
          [params]="{
            opacity: 1,
            showTime: true,
            customShowTimeStyle: {
              'background-color': '#000',
              'color': '#fff',
              'padding': '2px',
              'font-size': '10px'
            }
          }" /><mm-wavesurfer-markers
          [markers]="[
            {
              time: 0,
              draggable: true,
              label: 'Begin',
              color: '#ff990a'
            },
            {
              time: 100,
              label: 'V2',
              color: '#00ffcc',
              position: 'top',
              preventContextMenu: true
            }
          ]" /><mm-wavesurfer-timeline
      /></mm-wavesurfer>
    </main>
  `
})
export class RootPage {
  @ViewChild(WaveSurferComponent) wavesurfer: WaveSurferComponent;

  xxx(event): void {
    console.log(event);
  }
}
