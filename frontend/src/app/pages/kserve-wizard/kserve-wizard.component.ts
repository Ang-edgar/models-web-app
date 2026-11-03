import { Component, OnInit } from '@angular/core';
import { MWABackendService } from '../../services/backend.service';
import { PVCResponseObject } from '../../types/pvc';
import { NamespaceService } from 'kubeflow';
import { Router } from '@angular/router';

@Component({
  selector: 'app-kserve-wizard',
  templateUrl: './kserve-wizard.component.html',
  styleUrls: ['./kserve-wizard.component.scss'],
})
export class KServeWizardComponent implements OnInit{
  currentStep = 1;

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
    runtime: 'custom',
    serviceAccount: 'default',
    runtimeImage: '',
    namespace: '',
    deploymentMode: 'Standard',
    description: '',

    pvcName: '',
    mountPath: '/mnt/models',

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

    command: ``,
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
    return {
      apiVersion: 'serving.kserve.io/v1beta1',

      kind: 'InferenceService',

      metadata: {
        name: this.wizard.deploymentName,
        namespace: this.wizard.namespace,
        annotations: {
          'serving.kserve.io/deploymentMode':
            this.wizard.deploymentMode || 'Standard',
        }
      },

      spec: {
        predictor: {
          serviceAccountName: this.wizard.serviceAccount,

          ...(this.wizard.gpuEnabled && {
            nodeSelector: {
              'gpu-model': this.wizard.gpuModel,
            },
          }),

          ...(this.wizard.gpuEnabled && {
            tolerations: [
              {
                key: 'nvidia.com/gpu',
                operator: 'Equal',
                value: 'present',
                effect: 'NoSchedule',
              },
            ],
          }),

          containers: [
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
                  memory: `${this.wizard.memoryRequest}${this.wizard.memoryRequestUnit}`,
                },

                limits: {
                  cpu: this.wizard.cpuLimit,
                  memory: `${this.wizard.memoryLimit}${this.wizard.memoryLimitUnit}`,


                  ...(this.wizard.gpuEnabled && {
                    'nvidia.com/gpu': this.wizard.gpuCount,
                  }),
                },
              },

              ...(this.wizard.pvcName && {
                volumeMounts: [
                  {
                    name: 'model-storage',
                    mountPath: this.wizard.mountPath,
                  },
                ],
              }),
            },
          ],

          ...(this.wizard.pvcName && {
            volumes: [
              {
                name: 'model-storage',
                persistentVolumeClaim: {
                  claimName: this.wizard.pvcName,
                },
              },
            ],
          }),
        },
      },
    } as any;
  }

  createDeployment() {

    const confirmed = confirm(
      `Create endpoint "${this.wizard.deploymentName}" in namespace "${this.wizard.namespace}"?`,
    );

    if (!confirmed) {
      return;
    }

    if (!this.wizard.deploymentName?.trim()) {
      alert('InferenceService Name is required.');
      return;
    }

    const inferenceService = this.buildInferenceService();

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
