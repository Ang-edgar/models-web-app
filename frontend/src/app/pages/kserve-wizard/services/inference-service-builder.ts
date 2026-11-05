import { WizardConfig } from '../models/wizard.model';

export class InferenceServiceBuilder {

  static build(wizard: WizardConfig): any {

    const predictor: any = {
      serviceAccountName: wizard.serviceAccount,
    };

    // GPU node placement
    if (wizard.gpuEnabled) {

      predictor.nodeSelector = {
        'gpu-model': wizard.gpuModel,
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
    if (wizard.runtime !== 'custom') {

        const runtimeArgs =
            wizard.runtimeArgs
            .filter(arg => arg.argument)
            .map(arg => {

                if (!arg.value?.trim()) {
                return arg.argument;
                }

                return `${arg.argument}=${arg.value}`;

            });

      predictor.model = {
        runtime: wizard.runtime,

        modelFormat: {
          name: wizard.runtime,
        },

        storageUri:
          `pvc://${wizard.pvcName}/${wizard.modelPath}`,

        ...(runtimeArgs.length > 0 && {
        args: runtimeArgs,
        }),

        resources: {
          requests: {
            cpu: wizard.cpuRequest,
            memory:
              `${wizard.memoryRequest}${wizard.memoryRequestUnit}`,
          },

          limits: {
            cpu: wizard.cpuLimit,
            memory:
              `${wizard.memoryLimit}${wizard.memoryLimitUnit}`,

            ...(wizard.gpuEnabled && {
              'nvidia.com/gpu': wizard.gpuCount,
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

          image: wizard.runtimeImage,

          ports: wizard.ports
            .filter(port => port.name && port.containerPort)
            .map(port => ({
              name: port.name,
              containerPort: Number(port.containerPort),
            })),

          ...(wizard.command?.trim() && {
            command: [
              'sh',
              '-c',
              wizard.command
                .replace(/\r\n/g, '\n')
                .trim(),
            ],
          }),

          resources: {
            requests: {
              cpu: wizard.cpuRequest,
              memory:
                `${wizard.memoryRequest}${wizard.memoryRequestUnit}`,
            },

            limits: {
              cpu: wizard.cpuLimit,
              memory:
                `${wizard.memoryLimit}${wizard.memoryLimitUnit}`,

              ...(wizard.gpuEnabled && {
                'nvidia.com/gpu': wizard.gpuCount,
              }),
            },
          },
        },
      ];

      if (wizard.pvcName) {

        predictor.volumes = [
          {
            name: 'model-storage',
            persistentVolumeClaim: {
              claimName: wizard.pvcName,
            },
          },
        ];

        predictor.containers[0].volumeMounts = [
          {
            name: 'model-storage',
            mountPath: wizard.mountPath,
          },
        ];
      }
    }

    return {
      apiVersion: 'serving.kserve.io/v1beta1',

      kind: 'InferenceService',

      metadata: {
        name: wizard.deploymentName,

        namespace: wizard.namespace,

        annotations: {
          'serving.kserve.io/deploymentMode':
            wizard.deploymentMode || 'Standard',
        },
      },

      spec: {
        predictor,
      },
    };
  }
}