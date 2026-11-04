import { Component, Input, OnChanges } from '@angular/core';
import * as yaml from 'js-yaml';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss'],
})
export class ReviewComponent implements OnChanges {
  @Input() wizard: any;

  generatedYaml = '';

  ngOnChanges(): void {
    this.buildYaml();
  }

buildYaml(): void {
  const predictor: any = {
    serviceAccountName: this.wizard.serviceAccount,
  };

  let container: any = null;

  if (this.wizard.runtime === 'custom') {

    predictor.containers = [
      {
        name: 'kserve-container',
        image: this.wizard.runtimeImage || '<runtime-image>',
      },
    ];

    container = predictor.containers[0];

  } else {

    predictor.model = {
      runtime: this.wizard.runtime,
      modelFormat: {
        name: this.wizard.runtime,
      },
      storageUri: `pvc://${this.wizard.pvcName}/${this.wizard.modelPath}`,

      resources: {
        requests: {
          cpu: String(this.wizard.cpuRequest),
          memory: `${this.wizard.memoryRequest}${this.wizard.memoryRequestUnit}`,
        },

        limits: {
          cpu: String(this.wizard.cpuLimit),
          memory: `${this.wizard.memoryLimit}${this.wizard.memoryLimitUnit}`,
        },
      },
    };

  }

  if (this.wizard.runtime === 'custom') {

    // Ports
    if (this.wizard.ports?.length) {
      container.ports = this.wizard.ports
        .filter((p: any) => p.name && p.containerPort)
        .map((p: any) => ({
          containerPort: Number(p.containerPort),
          name: p.name,
          protocol: 'TCP',
        }));
    }

    // Command
    if (this.wizard.command?.trim()) {
      container.command = [
        'sh',
        '-c',
        this.wizard.command
          .replace(/\r\n/g, '\n')
          .trim(),
      ];
    }
  }

    // Resources
    container.resources = {
      requests: {
        cpu: String(this.wizard.cpuRequest),
        memory: `${this.wizard.memoryRequest}${this.wizard.memoryRequestUnit}`,
      },
      limits: {
        cpu: String(this.wizard.cpuLimit),
        memory: `${this.wizard.memoryLimit}${this.wizard.memoryLimitUnit}`,
      },
    };

  // GPU
  if (this.wizard.gpuEnabled) {

    predictor.nodeSelector = {
      'gpu-model': this.wizard.gpuModel,
    };

    predictor.tolerations = [
      {
        effect: 'NoSchedule',
        key: 'nvidia.com/gpu',
        operator: 'Equal',
        value: 'present',
      },
    ];

    if (this.wizard.runtime === 'custom') {

      container.resources.limits['nvidia.com/gpu'] =
        String(this.wizard.gpuCount);

    } else {

      predictor.model.resources.limits['nvidia.com/gpu'] =
        String(this.wizard.gpuCount);

    }
  }

  // PVC
  if (
    this.wizard.runtime === 'custom' &&
    this.wizard.pvcName
  ) {
    predictor.volumes = [
      {
        name: 'model-storage',
        persistentVolumeClaim: {
          claimName: this.wizard.pvcName,
        },
      },
    ];

    container.volumeMounts = [
      {
        name: 'model-storage',
        mountPath: this.wizard.mountPath,
      },
    ];
  }

  const manifest = {
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

  this.generatedYaml = yaml.dump(manifest, {
    lineWidth: -1,
    noRefs: true,
  });
}

  copyYaml(): void {
    navigator.clipboard.writeText(this.generatedYaml);
  }
}