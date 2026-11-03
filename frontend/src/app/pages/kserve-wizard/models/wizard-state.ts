export interface WizardState {
  deploymentName: string;
  runtime: string;
  namespace: string;
  description: string;

  notebookName?: string;

  volumes?: VolumeConfig[];

  cpu?: string;
  memory?: string;

  gpuCount?: number;

  modelPath?: string;
}