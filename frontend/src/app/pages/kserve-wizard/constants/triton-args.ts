import { RuntimeArgDefinition }
  from '../models/runtime-arg-definition.model';
  
export const TRITON_ARGS: RuntimeArgDefinition[] = [
  {
    argument: '--strict-model-config',
    label: 'Strict Model Config',
    defaultValue: 'false',
  },
  {
    argument: '--log-verbose',
    label: 'Verbose Logging',
    defaultValue: '1',
  },
  {
    argument: '--http-port',
    label: 'HTTP Port',
    defaultValue: '8080',
  },
  {
    argument: '--grpc-port',
    label: 'gRPC Port',
    defaultValue: '8001',
  },
  {
    argument: '--metrics-port',
    label: 'Metrics Port',
    defaultValue: '8002',
  },
  {
    argument: '--model-control-mode',
    label: 'Model Control Mode',
    defaultValue: 'poll',
  },
  {
    argument: '--repository-poll-secs',
    label: 'Repository Poll Seconds',
    defaultValue: '15',
  },
];