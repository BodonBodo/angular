import { Component } from '@angular/core';

@Component({
  selector: 'ng-recording-modal',
  templateUrl: './recording.component.html',
  styleUrls: ['./recording.component.css'],
})
export class RecordingComponent {
  visible = false;

  stop(): void {
    this.visible = false;
  }

  start(): void {
    this.visible = true;
  }
}
