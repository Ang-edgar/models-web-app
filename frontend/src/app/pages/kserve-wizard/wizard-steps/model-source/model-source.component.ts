import { Component, Input } from '@angular/core';
import { PVCResponseObject } from '../../../../types/pvc';

@Component({
  selector: 'app-model-source',
  templateUrl: './model-source.component.html',
  styleUrls: ['./model-source.component.scss'],
})
export class ModelSourceComponent {
  @Input() wizard: any;

  @Input() pvcs: PVCResponseObject[] = [];
}