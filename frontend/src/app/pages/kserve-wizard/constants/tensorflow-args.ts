import { RuntimeArgDefinition }
  from '../models/runtime-arg-definition.model';

export const TENSORFLOW_ARGS: RuntimeArgDefinition[] = [
  {
    argument: '--rest_api_port',
    label: 'REST API Port',
    defaultValue: '8501',
  },
  {
    argument: '--port',
    label: 'gRPC Port',
    defaultValue: '8500',
  },
  {
    argument: '--rest_api_timeout_in_ms',
    label: 'REST Timeout',
    defaultValue: '30000',
  },
  {
    argument: '--enable_batching',
    label: 'Enable Batching',
    defaultValue: 'true',
  },
  {
    argument: '--tensorflow_session_parallelism',
    label: 'Session Parallelism',
    defaultValue: '0',
  },
  {
    argument: '--allow_version_labels_for_unavailable_models',
    label: 'Allow Unavailable Versions',
    defaultValue: 'false',
  },
];