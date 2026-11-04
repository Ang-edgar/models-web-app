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

import * as ace from 'ace-builds';

import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-xcode';

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
      containerPort: null,
    });
  }

  removePort(index: number) {
    this.wizard.ports.splice(index, 1);
  }

  wizard = {
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

  private buildInferenceService() {

    const predictor: any = {
      serviceAccountName: this.wizard.serviceAccount,
    };

    // GPU node placement
    if (this.wizard.gpuEnabled) {

      predictor.nodeSelector = {
        'gpu-model': this.wizard.gpuModel,
      };

      predictor.tolerations = [
        {
          key: 'nvidia.com/gpu',
          operator: 'Equal',
          value: 'present',
          effect: 'NoSchedule',
        },
      ];
    }

    // Built-in Runtime
    if (this.wizard.runtime !== 'custom') {

      predictor.model = {
        runtime: this.wizard.runtime,

        modelFormat: {
          name: this.wizard.runtime,
        },

        storageUri:
          `pvc://${this.wizard.pvcName}/${this.wizard.modelPath}`,

        resources: {
          requests: {
            cpu: this.wizard.cpuRequest,
            memory:
              `${this.wizard.memoryRequest}${this.wizard.memoryRequestUnit}`,
          },

          limits: {
            cpu: this.wizard.cpuLimit,
            memory:
              `${this.wizard.memoryLimit}${this.wizard.memoryLimitUnit}`,

            ...(this.wizard.gpuEnabled && {
              'nvidia.com/gpu': this.wizard.gpuCount,
            }),
          },
        },
      };

    }

    // Custom Runtime
    else {

      predictor.containers = [
        {
          name: 'kserve-container',

          image: this.wizard.runtimeImage,

          ports: this.wizard.ports
            .filter(port => port.name && port.containerPort)
            .map(port => ({
              name: port.name,
              containerPort: Number(port.containerPort),
            })),

          ...(this.wizard.command?.trim() && {
            command: [
              'sh',
              '-c',
              this.wizard.command
                .replace(/\r\n/g, '\n')
                .trim(),
            ],
          }),

          resources: {
            requests: {
              cpu: this.wizard.cpuRequest,
              memory:
                `${this.wizard.memoryRequest}${this.wizard.memoryRequestUnit}`,
            },

            limits: {
              cpu: this.wizard.cpuLimit,
              memory:
                `${this.wizard.memoryLimit}${this.wizard.memoryLimitUnit}`,

              ...(this.wizard.gpuEnabled && {
                'nvidia.com/gpu': this.wizard.gpuCount,
              }),
            },
          },
        },
      ];

      if (this.wizard.pvcName) {

        predictor.volumes = [
          {
            name: 'model-storage',
            persistentVolumeClaim: {
              claimName: this.wizard.pvcName,
            },
          },
        ];

        predictor.containers[0].volumeMounts = [
          {
            name: 'model-storage',
            mountPath: this.wizard.mountPath,
          },
        ];
      }
    }

    return {
      apiVersion: 'serving.kserve.io/v1beta1',

      kind: 'InferenceService',

      metadata: {
        name: this.wizard.deploymentName,

        namespace: this.wizard.namespace,

        annotations: {
          'serving.kserve.io/deploymentMode':
            this.wizard.deploymentMode || 'Standard',
        },
      },

      spec: {
        predictor,
      },
    };
  }

  private populateWizardFromYaml(cr: any) {
    this.wizard.deploymentName = cr.metadata?.name || '';
    this.wizard.namespace = cr.metadata?.namespace || '';

    const predictor = cr.spec?.predictor || {};
    const container = predictor.containers?.[0] || {};

    this.wizard.serviceAccount =
      predictor.serviceAccountName || 'default';

    this.wizard.runtimeImage =
      container.image || '';

    this.wizard.command =
      container.command?.slice(2).join('\n') || '';

    this.wizard.pvcName =
      predictor.volumes?.find(
        v => v.persistentVolumeClaim,
      )?.persistentVolumeClaim?.claimName || '';

    this.wizard.mountPath =
      container.volumeMounts?.[0]?.mountPath ||
      '/mnt/models';

    const requests =
      container.resources?.requests || {};

    const limits =
      container.resources?.limits || {};

    this.wizard.cpuRequest =
      requests.cpu || '1';

    this.wizard.cpuLimit =
      limits.cpu || '2';

    this.wizard.memoryRequest =
      (requests.memory || '2Gi').replace('Gi', '');

    this.wizard.memoryLimit =
      (limits.memory || '4Gi').replace('Gi', '');

    this.wizard.gpuEnabled =
      !!limits['nvidia.com/gpu'];

    this.wizard.gpuCount =
      limits['nvidia.com/gpu'] || '1';

    this.wizard.gpuModel =
      predictor.nodeSelector?.['gpu-model'] || '';

    this.wizard.ports =
      container.ports?.map(p => ({
        name: p.name,
        containerPort: String(p.containerPort),
      })) || [];
  }

  toggleAdvancedMode(enabled: boolean) {

    if (enabled) {

      this.yamlData =
        dump(this.buildInferenceService());

      this.advancedMode = true;

      setTimeout(() => {

        this.initYamlEditor();

        this.aceYamlEditor?.setValue(
          this.yamlData,
          -1,
        );

      });

      return;
    }

    try {

      const cr = load(this.yamlData);

      this.populateWizardFromYaml(cr);

    } catch (e) {

      alert(
        'Unable to convert YAML back into Wizard mode.',
      );

      this.advancedMode = true;

      return;
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
      inferenceService = this.buildInferenceService();
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

