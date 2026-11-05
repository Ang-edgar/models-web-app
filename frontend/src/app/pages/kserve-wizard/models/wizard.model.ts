import { ContainerPort } from './port.model';
import { RuntimeArg } from './runtime-arg.model';

export interface WizardConfig {
  deploymentName: string;

  runtime: string;

  serviceAccount: string;
  runtimeImage: string;

  namespace: string;

  deploymentMode: string;

  description: string;

  pvcName: string;
  mountPath: string;
  modelPath: string;
  modelFormat: string;

  cpuRequest: string;
  cpuLimit: string;

  memoryRequest: string;
  memoryLimit: string;

  memoryRequestUnit: string;
  memoryLimitUnit: string;

  gpuEnabled: boolean;
  gpuVendor: string;
  gpuCount: string;
  gpuModel: string;

  gpuCore: string;
  gpuMemory: string;

  ports: ContainerPort[];

  command: string;
  runtimeArgs: RuntimeArg[];
  commandOverride: string;
  args: string;
  
}