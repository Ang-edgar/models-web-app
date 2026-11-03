import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-serving-runtime',
  templateUrl: './serving-runtime.component.html',
  styleUrls: ['./serving-runtime.component.scss'],
})
export class ServingRuntimeComponent {
  @Input() wizard: any;
}