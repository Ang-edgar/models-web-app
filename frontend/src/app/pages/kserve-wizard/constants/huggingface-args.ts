import { RuntimeArgDefinition }
  from '../models/runtime-arg-definition.model';

export const HUGGINGFACE_ARGS: RuntimeArgDefinition[] = [
  {
    argument: '--model-id',
    label: 'Model ID',
    defaultValue: '',
  },
  {
    argument: '--trust-remote-code',
    label: 'Trust Remote Code',
    defaultValue: 'true',
  },
  {
    argument: '--max-batch-size',
    label: 'Max Batch Size',
    defaultValue: '8',
  },
  {
    argument: '--max-concurrent-requests',
    label: 'Max Concurrent Requests',
    defaultValue: '128',
  },
  {
    argument: '--dtype',
    label: 'Data Type',
    defaultValue: 'auto',
  },
  {
    argument: '--device',
    label: 'Device',
    defaultValue: 'cuda',
  },
  {
    argument: '--revision',
    label: 'Model Revision',
    defaultValue: '',
  },
];