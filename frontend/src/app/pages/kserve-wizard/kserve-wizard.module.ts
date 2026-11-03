import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AceModule } from 'ngx-ace-wrapper';
import { ACE_CONFIG } from 'ngx-ace-wrapper';
import { AceConfigInterface } from 'ngx-ace-wrapper';

import { KubeflowModule } from 'kubeflow';

import { KServeWizardComponent } from './kserve-wizard.component';
import { BasicInfoComponent } from './wizard-steps/basic-info/basic-info.component';
import { ModelSourceComponent } from './wizard-steps/model-source/model-source.component';
import { ServingRuntimeComponent } from './wizard-steps/serving-runtime/serving-runtime.component';
import { ResourcesComponent } from './wizard-steps/resources/resources.component';
import { ContainerConfigComponent } from './wizard-steps/container-config/container-config.component';
import { ReviewComponent } from './wizard-steps/review/review.component';

const DEFAULT_ACE_CONFIG: AceConfigInterface = {
  tabSize: 2,
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: true,
  wrap: true,
  autoScrollEditorIntoView: true,
};

@NgModule({
  declarations: [
    KServeWizardComponent,
    BasicInfoComponent,
    ServingRuntimeComponent,
    ModelSourceComponent,
    ResourcesComponent,
    ContainerConfigComponent,
    ReviewComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    KubeflowModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    AceModule,
  ],
  exports: [
    KServeWizardComponent,
  ],
  providers: [
    {
      provide: ACE_CONFIG,
      useValue: DEFAULT_ACE_CONFIG,
    },
  ],
})
export class KServeWizardModule {}