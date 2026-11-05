import { Component, Input, OnChanges } from '@angular/core';
import * as yaml from 'js-yaml';
import { InferenceServiceBuilder }
  from '../../services/inference-service-builder';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss'],
})
export class ReviewComponent implements OnChanges {
  @Input() wizard: any;

  generatedYaml = '';

  ngOnChanges(): void {
    //console.log('Review ngOnChanges');
    this.buildYaml();
  }

  buildYaml(): void {

    const manifest =
      InferenceServiceBuilder.build(
        this.wizard,
      );

    this.generatedYaml =
      yaml.dump(
        manifest,
        {
          lineWidth: -1,
          noRefs: true,
        },
      );

  }
  copyYaml(): void {
    navigator.clipboard.writeText(this.generatedYaml);
  }
}