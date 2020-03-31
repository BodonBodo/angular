import { Component, Input } from '@angular/core';
import { VisualizationMode } from '../timeline.component';
import { ProfilerFrame } from 'protocol';

@Component({
  selector: 'ng-timeline-visualizer',
  templateUrl: './timeline-visualizer.component.html',
  styleUrls: ['./timeline-visualizer.component.scss'],
})
export class TimelineVisualizerComponent {
  @Input() visualizationMode: VisualizationMode;
  @Input() frame: ProfilerFrame;

  cmpVisualizationModes = VisualizationMode;
}
