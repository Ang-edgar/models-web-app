import { MWABackendService } from '../../services/backend.service';
import { PVCResponseObject } from '../../types/pvc';
import { NamespaceService } from 'kubeflow';
import { Router } from '@angular/router';
import { dump, load } from 'js-yaml';
import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { InferenceServiceBuilder }
  from './services/inference-service-builder';

import * as ace from 'ace-builds';

import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-xcode';
import { WizardConfig } from './models/wizard.model';
import { YamlParser } from './services/yaml-parser';

@Component({
  selector: 'app-kserve-wizard',
  templateUrl: './kserve-wizard.component.html',
  styleUrls: ['./kserve-wizard.component.scss'],
})
export class KServeWizardComponent implements OnInit, OnDestroy{

  @ViewChild('yamlEditor')
  yamlEditor?: ElementRef;

  private aceYamlEditor?: ace.Ace.Editor;

  private initYamlEditor() {

    if (!this.yamlEditor) {
      return;
    }

    if (this.aceYamlEditor) {
      return;
    }

    this.aceYamlEditor = ace.edit(
      this.yamlEditor.nativeElement,
      {
        mode: 'ace/mode/yaml',
        theme: 'ace/theme/xcode',
        tabSize: 2,
        wrap: true,
      },
    );

    this.aceYamlEditor.session.setUseWorker(false);

    this.aceYamlEditor.setValue(
      this.yamlData || '',
      -1,
    );

    this.aceYamlEditor.on('change', () => {
      this.yamlData =
        this.aceYamlEditor?.getValue() || '';
    });
  }

  ngOnDestroy() {

    if (this.aceYamlEditor) {
      this.aceYamlEditor.destroy();
    }

  }
  currentStep = 1;

  advancedMode = false;

  yamlData = '';

  steps = [
    'Basic Info',
    'Model Source',
    'Serving Runtime',
    'Resources',
    'Networking',
    'Review YAML',
  ];

  pvcs: PVCResponseObject[] = [];

  gpuModels = [
    {
      value: 'nvidia-l40',
      displayName: 'NVIDIA L40',
    },
    {
      value: 'nvidia-a100',
      displayName: 'NVIDIA A100',
    },
    {
      value: 'nvidia-h100',
      displayName: 'NVIDIA H100',
    },
  ];

  gpuCounts = ['1', '2', '3', '4', '5', '6', '7', '8'];

  constructor(
    private backend: MWABackendService,
    public namespaceService: NamespaceService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.namespaceService
      .getSelectedNamespace()
      .subscribe(namespace => {
        if (namespace) {
          this.wizard.namespace = namespace as string;
        }
      });
  }

  loadPVCs() {
    console.log('Namespace:', this.wizard.namespace);
    this.backend.getPVCs(this.wizard.namespace)
      .subscribe({
        next: pvcs => {
          this.pvcs = pvcs;
        },
        error: err => {
          console.error(err);
        },
      });
  }

  addPort() {
    this.wizard.ports.push({
      name: '',
      containerPort: '',
    });
  }

  removePort(index: number) {
    this.wizard.ports.splice(index, 1);
  }

  addRuntimeArg() {
    this.wizard.runtimeArgs.push({
      argument: '',
      value: '',
    });
  }

  removeRuntimeArg(index: number) {
    this.wizard.runtimeArgs.splice(
      index,
      1,
    );
  }

  wizard: WizardConfig = {
    deploymentName: '',

    runtime: 'vLLM',

    serviceAccount: 'default',

    runtimeImage: '',

    namespace: '',

    deploymentMode: 'Standard',

    description: '',

    pvcName: '',

    mountPath: '/mnt/models',

    modelPath: '',

    modelFormat: 'vLLM',

    cpuRequest: '1',
    cpuLimit: '2',

    memoryRequest: '2',
    memoryLimit: '4',

    memoryRequestUnit: 'Gi',
    memoryLimitUnit: 'Gi',

    gpuEnabled: false,
    gpuVendor: 'NVIDIA',
    gpuModel: '',
    gpuCount: '1',

    gpuCore: '',
    gpuMemory: '',

    ports: [
      {
        name: 'http',
        containerPort: '8080',
      },
    ],

    command: '',
    runtimeArgs: [],
    commandOverride: '',
    args: '',
  };

  cancel() {
    const confirmed = confirm(
      'Are you sure you want to cancel? All unsaved changes will be lost.',
    );

    if (!confirmed) {
      return;
    }

    this.router.navigate(['/']);
  }
  
  nextStep() {

    if (
      this.currentStep === 1 &&
      !this.wizard.deploymentName?.trim()
    ) {
      alert('InferenceService Name is required.');
      return;
    }

    if (
      this.currentStep === 2 &&
      this.wizard.runtime === 'custom' &&
      !this.wizard.runtimeImage
    ) {
      alert('Runtime Image is required for Custom Runtime.');
      return;
    }

    if (this.currentStep === 4) {

      if (
        Number(this.wizard.cpuRequest) <= 0 ||
        Number(this.wizard.cpuLimit) <= 0
      ) {
        alert('CPU Request and CPU Limit must be greater than 0.');
        return;
      }

      if (
        Number(this.wizard.memoryRequest) <= 0 ||
        Number(this.wizard.memoryLimit) <= 0
      ) {
        alert('Memory Request and Memory Limit must be greater than 0.');
        return;
      }

      if (
        this.wizard.gpuEnabled &&
        Number(this.wizard.gpuCount) <= 0
      ) {
        alert('GPU Count must be greater than 0.');
        return;
      }
    }

    if (this.currentStep < 6) {
      this.currentStep++;

      if (this.currentStep === 3) {
        this.loadPVCs();
      }
    }
    
  }
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }


  toggleAdvancedMode(enabled: boolean) {
    //
    if (enabled) {

      this.yamlData =
        dump(
          InferenceServiceBuilder.build(
            this.wizard,
          ),
        );

      this.advancedMode = true;

      setTimeout(() => {

        if (!this.aceYamlEditor) {
          this.initYamlEditor();
        }

        this.aceYamlEditor?.setValue(
          this.yamlData,
          -1,
        );

        this.aceYamlEditor?.resize();

      });

      return;
    }

    try {

      const cr = load(this.yamlData);

      YamlParser.populateWizard(
        cr,
        this.wizard,
      );

    } catch (e) {

      alert(
        'Unable to convert YAML back into Wizard mode.',
      );

      this.advancedMode = true;

      return;
    }

    if (this.aceYamlEditor) {
      this.aceYamlEditor.destroy();
      this.aceYamlEditor = undefined;
    }

    this.advancedMode = false;
  }

  createDeployment() {

    if (!this.wizard.deploymentName?.trim()) {
      alert('InferenceService Name is required.');
      return;
    }

    let inferenceService;

    if (this.advancedMode) {
      inferenceService = load(this.yamlData);
    } else {
      inferenceService = InferenceServiceBuilder.build(
  this.wizard,
);
    }

    const confirmed = confirm(
      `Create endpoint "${inferenceService.metadata?.name}" in namespace "${inferenceService.metadata?.namespace}"?`,
    );

    if (!confirmed) {
      return;
    }

    console.log(
      JSON.stringify(
        inferenceService,
        null,
        2,
      ),
    );

    // SAFETY: test first before uncommenting
    
    this.backend
      .postInferenceService(inferenceService)
      .subscribe({
        next: response => {
          console.log('Created successfully', response);

          alert('Endpoint created successfully');

          this.router.navigate(['/']);
        },

        error: error => {
          console.error(error);
        },
      });
    
  }
}

