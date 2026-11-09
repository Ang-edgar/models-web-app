import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  KubeflowModule,
  PanelModule,
  LoadingSpinnerModule,
  IconModule,
} from 'kubeflow';

import { LogsComponent } from './logs.component';
import { LogsViewerModule } from './logs-viewer/logs-viewer.module';

@NgModule({
  declarations: [LogsComponent],
  imports: [
    CommonModule,
    FormsModule,

    KubeflowModule,
    LogsViewerModule,

    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTooltipModule,

    LoadingSpinnerModule,
    PanelModule,
    IconModule,
  ],
  exports: [LogsComponent],
})
export class LogsModule {}
