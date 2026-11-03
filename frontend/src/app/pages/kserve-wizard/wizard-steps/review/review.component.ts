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
    containers: [
      {
        name: 'kserve-container',
        image: this.wizard.runtimeImage || '<runtime-image>',
      },
    ],
  };

  const container = predictor.containers[0];

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
    container.resources.limits['nvidia.com/gpu'] =
      String(this.wizard.gpuCount);

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
  }

  // PVC
  if (this.wizard.pvcName) {
    predictor.volumes = [
      {
        name: this.wizard.pvcName,
        persistentVolumeClaim: {
          claimName: this.wizard.pvcName,
        },
      },
    ];

    container.volumeMounts = [
      {
        mountPath: this.wizard.mountPath,
        name: this.wizard.pvcName,
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